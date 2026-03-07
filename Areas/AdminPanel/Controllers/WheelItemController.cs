using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LPicker.Data;
using LPicker.Models;

namespace LPicker.Areas.AdminPanel.Controllers
{
    [Authorize(Roles = "SuperAdmin, Admin")]
    [Area("AdminPanel")]
    public class WheelItemController : Controller
    {
        private LunchPickerDbContext _context { get; }

        public WheelItemController(LunchPickerDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            return View(_context.WheelItems.Where(c => !c.IsDeleted));
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(WheelItem item)
        {
            if (!ModelState.IsValid) return View(item);

            item.IsDeleted = false;
            _context.WheelItems.Add(item);
            await _context.SaveChangesAsync();
            return RedirectToAction("Index");
        }

        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return BadRequest();

            WheelItem? item = await _context.WheelItems
                .Where(i => !i.IsDeleted)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (item == null) return NotFound();

            item.IsDeleted = true;
            await _context.SaveChangesAsync();
            return RedirectToAction("Index");
        }

        public IActionResult Update(int? id)
        {
            if (id == null) return BadRequest();

            WheelItem? item = _context.WheelItems
                .Where(i => !i.IsDeleted)
                .FirstOrDefault(c => c.Id == id);

            if (item == null) return NotFound();

            return View(item);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update(WheelItem item)
        {
            if (!ModelState.IsValid) return View(item);

            WheelItem? existItem = _context.WheelItems
                .Where(i => !i.IsDeleted)
                .FirstOrDefault(c => c.Id == item.Id);

            if (existItem == null) return NotFound();

            existItem.Name = item.Name;
            await _context.SaveChangesAsync();
            return RedirectToAction("Index");
        }
    }
}