using Microsoft.AspNetCore.Mvc;

namespace LPicker.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}