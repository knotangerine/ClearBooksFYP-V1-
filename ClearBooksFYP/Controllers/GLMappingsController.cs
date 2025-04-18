using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClearBooksFYP.Models;
using System.Xml.Serialization;

namespace ClearBooksFYP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GLMappingsController : ControllerBase
    {
        private readonly ClearBooksDbContext _context;

        public GLMappingsController(ClearBooksDbContext context)
        {
            _context = context;
        }

        // GET: api/GLMappings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GLMapping>>> GetGLMappings()
        {
            var mappings = await _context.GLMappings.ToListAsync();
            return Ok(mappings);
        }

        // GET: api/GLMappings/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<GLMapping>> GetGLMapping(int id)
        {
            var mapping = await _context.GLMappings.FindAsync(id);

            if (mapping == null)
            {
                return NotFound(new { message = "Mapping not found" });
            }

            return mapping;
        }

        // POST: api/GLMappings
        [HttpPost]
        public async Task<ActionResult<GLMapping>> AddGLMapping(GLMapping newMapping)
        {
            try
            {
                newMapping.CreatedAt = DateTime.Now;
                newMapping.UpdatedAt = DateTime.Now;
                _context.GLMappings.Add(newMapping);
                await _context.SaveChangesAsync();
                return CreatedAtAction(
                    nameof(GetGLMappings),
                    new { id = newMapping.MappingId },
                    newMapping
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // PUT: api/GLMappings/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGLMapping(int id, GLMapping updatedMapping)
        {
            try
            {
                var existingMapping = await _context.GLMappings.FindAsync(id);

                if (existingMapping == null)
                {
                    return NotFound(new { message = "Mapping not found" });
                }

                existingMapping.TransactionType = updatedMapping.TransactionType;
                existingMapping.DebitAccount = updatedMapping.DebitAccount;
                existingMapping.CreditAccount = updatedMapping.CreditAccount;
                existingMapping.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(existingMapping);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // DELETE: api/GLMappings/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGLMapping(int id)
        {
            try
            {
                var mapping = await _context.GLMappings.FindAsync(id);

                if (mapping == null)
                {
                    return NotFound(new { message = "Mapping not found" });
                }

                _context.GLMappings.Remove(mapping);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Mapping deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }
    }
}