using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LPicker.Data;

namespace LPicker.Areas.AdminPanel.Controllers
{
    [Area("AdminPanel")]
    [Authorize(Roles = "Admin, SuperAdmin")]
    public class SpinResultController : Controller
    {
        private readonly LunchPickerDbContext _context;

        public SpinResultController(LunchPickerDbContext context)
        {
            _context = context;
        }

        // GET: List
        public async Task<IActionResult> Index()
        {
            var results = await _context.SpinResults
                .OrderByDescending(r => r.SpinTime)
                .Take(50)
                .ToListAsync();

            return View(results);
        }

        // POST: Clear All
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearAll()
        {
            var allResults = await _context.SpinResults.ToListAsync();
            _context.SpinResults.RemoveRange(allResults);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Index));
        }

        // POST: Delete Single
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _context.SpinResults.FindAsync(id);
            if (result != null)
            {
                _context.SpinResults.Remove(result);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}