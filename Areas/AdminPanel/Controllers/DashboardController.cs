using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LPicker.Data;
using Microsoft.EntityFrameworkCore;

namespace LPicker.Areas.AdminPanel.Controllers
{
    [Authorize(Roles = "SuperAdmin, Admin")]
    [Area("AdminPanel")]
    public class DashboardController : Controller
    {
        private readonly LunchPickerDbContext _context;

        public DashboardController(LunchPickerDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            ViewBag.TotalSpins = _context.SpinResults.Count(s => !s.IsDeleted);
            ViewBag.TotalUsers = _context.Users.Count();
            ViewBag.TotalItems = _context.WheelItems.Count(w => !w.IsDeleted);
            ViewBag.TodaySpins = _context.SpinResults
                .Count(s => !s.IsDeleted && s.SpinDate.Date == DateTime.Today);

            var recentSpins = _context.SpinResults
                .Include(s => s.User)
                .Where(s => !s.IsDeleted)
                .OrderByDescending(s => s.SpinDate)
                .Take(10)
                .ToList();
            ViewBag.RecentSpins = recentSpins;

            var topFoods = _context.SpinResults
                .Where(s => !s.IsDeleted && s.Result != null)
                .GroupBy(s => s.Result)
                .Select(g => new { Name = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToList();
            ViewBag.TopFoods = topFoods;

            return View();
        }
    }
}