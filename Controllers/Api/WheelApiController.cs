using LPicker.Data;
using LPicker.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPicker.Controllers.Api
{
    [Route("api/wheel")]
    [ApiController]
    public class WheelApiController : ControllerBase
    {
        private readonly LunchPickerDbContext _context;
        private readonly UserManager<AppUser> _userManager;

        public WheelApiController(LunchPickerDbContext context, UserManager<AppUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // İstifadəçi məlumatını qaytar
        [HttpGet("userinfo")]
        public async Task<IActionResult> GetUserInfo()
        {
            var user = await _userManager.GetUserAsync(User);
            return Ok(new { userName = user?.UserName });
        }

        // Ümumi + İstifadəçinin öz elementləri
        [HttpGet("items")]
        public async Task<IActionResult> GetItems()
        {
            var user = await _userManager.GetUserAsync(User);

            var query = _context.WheelItems.Where(w => !w.IsDeleted);

            if (user != null)
            {
                // Daxil olub: Ümumi (UserId=NULL) + Öz elementləri
                query = query.Where(w => w.UserId == null || w.UserId == user.Id);
            }
            else
            {
                // Qonaq: Yalnız ümumi elementlər
                query = query.Where(w => w.UserId == null);
            }

            var items = await query
                .Select(w => new { w.Id, w.Name })
                .ToListAsync();

            return Ok(items);
        }

        // Yeni element əlavə et
        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddItemRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { error = "Name is required" });

            var user = await _userManager.GetUserAsync(User);

            var item = new WheelItem
            {
                Name = request.Name.Trim(),
                UserId = user?.Id,
                IsDeleted = false
            };

            _context.WheelItems.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new { id = item.Id, name = item.Name });
        }

        [HttpDelete("items/{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var user = await _userManager.GetUserAsync(User);

            var item = await _context.WheelItems
                .FirstOrDefaultAsync(w => w.Id == id && w.UserId == user.Id);

            if (item == null) return NotFound();

            item.IsDeleted = true;
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpPost("spin")]
        public async Task<IActionResult> SaveSpin([FromBody] SpinRequest request)
        {
            var user = await _userManager.GetUserAsync(User);

            var spinResult = new SpinResult
            {
                UserId = user?.Id,
                WheelItemId = request.WheelItemId,
                Result = request.Result,
                SpinDate = DateTime.Now,
                IsDeleted = false
            };

            _context.SpinResults.Add(spinResult);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpGet("results")]
        public async Task<IActionResult> GetResults()
        {
            var user = await _userManager.GetUserAsync(User);

            var query = _context.SpinResults
                .Include(s => s.User)
                .Include(s => s.WheelItem)
                .Where(s => !s.IsDeleted);

            if (user != null)
            {
                query = query.Where(s => s.UserId == user.Id);
            }

            var results = await query
                .OrderByDescending(s => s.SpinDate)
                .Take(20)
                .Select(s => new
                {
                    s.Id,
                    Name = s.Result ?? (s.WheelItem != null ? s.WheelItem.Name : "Unknown"),
                    UserName = s.User != null ? s.User.UserName : "Qonaq",
                    Time = s.SpinDate.ToString("HH:mm")
                })
                .ToListAsync();

            return Ok(results);
        }
    }

    public class SpinRequest
    {
        public int? WheelItemId { get; set; }
        public string? Result { get; set; }
    }

    public class AddItemRequest
    {
        public string Name { get; set; }
    }
}