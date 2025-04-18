using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClearBooksFYP.Models;

namespace ClearBooksFYP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VouchersController : ControllerBase
    {
        private readonly ClearBooksDbContext _context;

        public VouchersController(ClearBooksDbContext context)
        {
            _context = context;
        }

        // GET: api/Vouchers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VoucherHeader>>> GetVouchers()
        {
            try
            {
                var vouchers = await _context.VoucherHeaders
                    .Include(v => v.VoucherDetails)
                    .Select(v => new
                    {
                        v.VoucherId,
                        v.VoucherNumber,
                        v.VoucherDate,
                        v.TransactionType,
                        v.Description,
                        v.TotalAmount,
                        v.Status,
                        VoucherDetails = v.VoucherDetails.Select(vd => new
                        {
                            vd.DetailId,
                            vd.VoucherId,
                            vd.AccountId,
                            vd.IsDebit,
                            vd.Amount,
                            vd.Description,
                            AccountName = vd.ChartOfAccount.AccountName
                        })
                    })
                    .ToListAsync();

                return Ok(vouchers);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/Vouchers/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<VoucherHeader>> GetVoucher(int id)
        {
            try
            {
                var voucher = await _context.VoucherHeaders
                    .Include(v => v.VoucherDetails)
                    .ThenInclude(vd => vd.ChartOfAccount)
                    .Where(v => v.VoucherId == id)
                    .Select(v => new
                    {
                        v.VoucherId,
                        v.VoucherNumber,
                        v.VoucherDate,
                        v.TransactionType,
                        v.Description,
                        v.TotalAmount,
                        v.Status,
                        VoucherDetails = v.VoucherDetails.Select(vd => new
                        {
                            vd.DetailId,
                            vd.VoucherId,
                            vd.AccountId,
                            vd.IsDebit,
                            vd.Amount,
                            vd.Description,
                            AccountName = vd.ChartOfAccount.AccountName
                        })
                    })
                    .FirstOrDefaultAsync();

                if (voucher == null)
                {
                    return NotFound(new { message = "Voucher not found" });
                }

                return Ok(voucher);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/Vouchers
        [HttpPost]
        public async Task<ActionResult<VoucherHeader>> CreateVoucher(VoucherHeader voucher)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState });
                }

                // Set timestamps
                var now = DateTime.Now;
                voucher.CreatedAt = now;
                voucher.UpdatedAt = now;

                // Set VoucherId to 0 to ensure new record
                voucher.VoucherId = 0;

                foreach (var detail in voucher.VoucherDetails)
                {
                    detail.DetailId = 0; // Ensure new record
                    detail.VoucherId = 0; // Will be set by EF Core
                    detail.CreatedAt = now;
                    detail.UpdatedAt = now;

                    // Clear navigation properties
                    detail.VoucherHeader = null;
                    detail.ChartOfAccount = null;
                }

                _context.VoucherHeaders.Add(voucher);
                await _context.SaveChangesAsync();

                // Reload the voucher with all related data
                var savedVoucher = await _context.VoucherHeaders
                    .Include(v => v.VoucherDetails)
                    .ThenInclude(vd => vd.ChartOfAccount)
                    .FirstOrDefaultAsync(v => v.VoucherId == voucher.VoucherId);

                if (savedVoucher == null)
                {
                    return BadRequest(new { message = "Failed to save voucher" });
                }

                return Ok(new
                {
                    message = "Voucher saved successfully",
                    data = savedVoucher
                });
            }
            catch (DbUpdateException dbEx)
            {
                return BadRequest(new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Error: " + ex.Message });
            }
        }




        // PUT: api/Vouchers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVoucher(int id, VoucherHeader updatedVoucher)
        {
            if (id != updatedVoucher.VoucherId)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            try
            {
                var existingVoucher = await _context.VoucherHeaders
                    .Include(v => v.VoucherDetails)
                    .FirstOrDefaultAsync(v => v.VoucherId == id);

                if (existingVoucher == null)
                {
                    return NotFound(new { message = "Voucher not found" });
                }

                // Update header fields
                existingVoucher.VoucherDate = updatedVoucher.VoucherDate;
                existingVoucher.TransactionType = updatedVoucher.TransactionType;
                existingVoucher.Description = updatedVoucher.Description;
                existingVoucher.TotalAmount = updatedVoucher.TotalAmount;
                existingVoucher.Status = updatedVoucher.Status;
                existingVoucher.UpdatedAt = DateTime.Now;

                // Remove existing details
                _context.VoucherDetails.RemoveRange(existingVoucher.VoucherDetails);

                // Add updated details
                foreach (var detail in updatedVoucher.VoucherDetails)
                {
                    detail.VoucherId = id;
                    detail.VoucherHeader = existingVoucher;  // Set the navigation property
                    detail.CreatedAt = DateTime.Now;
                    detail.UpdatedAt = DateTime.Now;

                    // Clear the ChartOfAccount navigation property
                    if (detail.ChartOfAccount != null)
                    {
                        var accountId = detail.ChartOfAccount.AccountId;
                        detail.ChartOfAccount = null;
                        detail.AccountId = accountId;
                    }

                    _context.VoucherDetails.Add(detail);
                }

                await _context.SaveChangesAsync();

                // Reload the voucher with related data
                var savedVoucher = await _context.VoucherHeaders
                    .Include(v => v.VoucherDetails)
                    .ThenInclude(vd => vd.ChartOfAccount)
                    .FirstOrDefaultAsync(v => v.VoucherId == id);

                return Ok(savedVoucher);
            }
            catch (DbUpdateException dbEx)
            {
                Console.WriteLine($"Database Error: {dbEx.InnerException?.Message ?? dbEx.Message}");
                return BadRequest(new { message = "Error updating database. Please check your data and try again." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"General Error: {ex.Message}");
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // DELETE: api/Vouchers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVoucher(int id)
        {
            try
            {
                var voucher = await _context.VoucherHeaders
                    .Include(v => v.VoucherDetails)
                    .FirstOrDefaultAsync(v => v.VoucherId == id);

                if (voucher == null)
                {
                    return NotFound(new { message = "Voucher not found" });
                }

                // Remove all related details first
                _context.VoucherDetails.RemoveRange(voucher.VoucherDetails);

                // Then remove the header
                _context.VoucherHeaders.Remove(voucher);

                await _context.SaveChangesAsync();

                return Ok(new { message = "Voucher deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error deleting voucher: {ex.Message}" });
            }
        }

        // GET: api/Vouchers/GetNewVoucherNumber
        [HttpGet("GetNewVoucherNumber")]
        public async Task<ActionResult<string>> GetNewVoucherNumber()
        {
            var lastVoucher = await _context.VoucherHeaders
                .OrderByDescending(v => v.VoucherNumber)
                .FirstOrDefaultAsync();

            string newNumber = "V-00001";

            if (lastVoucher != null && lastVoucher.VoucherNumber.StartsWith("V-"))
            {
                int lastNumber = int.Parse(lastVoucher.VoucherNumber.Substring(2));
                newNumber = $"V-{(lastNumber + 1):D5}";
            }

            return Ok(new { voucherNumber = newNumber });
        }
    }
}