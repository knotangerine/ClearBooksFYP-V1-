using ClearBooksFYP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClearBooksFYP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChartOfAccountsController : ControllerBase
    {
        private readonly ClearBooksDbContext _context;

        public ChartOfAccountsController(ClearBooksDbContext context)
        {
            _context = context;
        }

        // GET: api/ChartOfAccounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChartOfAccount>>> GetChartOfAccounts()
        {
            var chartOfAccounts = await _context.ChartOfAccounts.ToListAsync();
            return Ok(chartOfAccounts);
        }

        // GET: api/ChartOfAccounts/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ChartOfAccount>> GetChartOfAccount(int id)
        {
            var account = await _context.ChartOfAccounts.FindAsync(id);

            if (account == null)
            {
                return NotFound(new { message = "Account not found" });
            }

            return account;
        }

        // POST: api/ChartOfAccounts
        [HttpPost]
        public async Task<ActionResult<ChartOfAccount>> AddChartOfAccount(ChartOfAccount newAccount)
        {
            try
            {
                newAccount.CreatedAt = DateTime.Now;
                newAccount.UpdatedAt = DateTime.Now;
                _context.ChartOfAccounts.Add(newAccount);
                await _context.SaveChangesAsync();
                return CreatedAtAction(
                    nameof(GetChartOfAccounts),
                    new { id = newAccount.AccountId },
                    newAccount
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // PUT: api/ChartOfAccounts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateChartOfAccount(int id, ChartOfAccount updatedAccount)
        {
            try
            {
                var existingAccount = await _context.ChartOfAccounts.FindAsync(id);

                if (existingAccount == null)
                {
                    return NotFound(new { message = "Account not found" });
                }

                // Update properties
                existingAccount.AccountNumber = updatedAccount.AccountNumber;
                existingAccount.AccountName = updatedAccount.AccountName;
                existingAccount.AccountType = updatedAccount.AccountType;
                existingAccount.ParentAccount = updatedAccount.ParentAccount;
                existingAccount.Description = updatedAccount.Description;
                existingAccount.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(existingAccount);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // DELETE: api/ChartOfAccounts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChartOfAccount(int id)
        {
            try
            {
                var account = await _context.ChartOfAccounts.FindAsync(id);

                if (account == null)
                {
                    return NotFound(new { message = "Account not found" });
                }

                // Check if this account is a parent account
                var hasChildren = await _context.ChartOfAccounts
                    .AnyAsync(a => a.ParentAccount == id);

                if (hasChildren)
                {
                    return BadRequest(new { message = "Cannot delete account with child accounts" });
                }

                _context.ChartOfAccounts.Remove(account);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }
    }
}