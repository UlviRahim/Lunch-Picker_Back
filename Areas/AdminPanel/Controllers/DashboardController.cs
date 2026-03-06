using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LPicker.Data;

namespace LPicker.Areas.AdminPanel.Controllers
{
    [Area("AdminPanel")]
    [Authorize(Roles = "Admin, SuperAdmin")]
    public class DashboardController : Controller
    {
        private readonly LunchPickerDbContext _context;

        public DashboardController(LunchPickerDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            ViewBag.TotalItems = _context.WheelItems.Count();
            ViewBag.TotalSpins = _context.SpinResults.Count();
            ViewBag.TodaySpins = _context.SpinResults
                .Count(r => r.SpinTime.Date == DateTime.Today);
            ViewBag.WeeklySpins = _context.SpinResults
                .Count(r => r.SpinTime >= DateTime.Now.AddDays(-7));

            return View();
        }
    }
}