using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LPicker.Data;

namespace LPicker.Areas.AdminPanel.Controllers
{
    [Authorize(Roles = "SuperAdmin, Admin")]
    [Area("AdminPanel")]
    public class SpinResultController : Controller
    {
        private LunchPickerDbContext _context { get; }

        public SpinResultController(LunchPickerDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            var results = _context.SpinResults
                .Include(s => s.User)
                .Include(s => s.WheelItem)
                .OrderByDescending(s => s.SpinDate)
                .ToList();

            return View(results);
        }
    }
}