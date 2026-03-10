    using LPicker.Services;
    using Microsoft.AspNetCore.Mvc;
    using System.Diagnostics;

    namespace LPicker.Controllers
    {
        public class HomeController : Controller
        {
            private readonly MealService _mealService;

            public HomeController(MealService mealService)
            {
                _mealService = mealService;
            }

            public IActionResult Index()
            {
                return View();
            }

            // API: Random meal 
            [HttpGet]
            public async Task<IActionResult> RandomMeal()
            {
                var meal = await _mealService.GetRandomMealAsync();
                if (meal == null)
                {
                    return Json(new { error = "Yemək tapılmadı" });
                }
                return Json(new
                {
                    id = meal.IdMeal,
                    name = meal.StrMeal,
                    category = meal.StrCategory,
                    area = meal.StrArea,
                    image = meal.StrMealThumb,
                    instructions = meal.StrInstructions,
                    youtube = meal.StrYoutube,
                    ingredients = meal.GetIngredients()
                });
            }

            // API: 
            [HttpGet]
            public async Task<IActionResult> SearchMeal(string name)
            {
                if (string.IsNullOrEmpty(name))
                {
                    return Json(new { error = "Ad daxil edin" });
                }

                var meals = await _mealService.SearchMealAsync(name);
                if (meals == null || meals.Count == 0)
                {
                    return Json(new { error = "Bu yemək tapılmadı" });
                }

                var result = meals[0];
                return Json(new
                {
                    id = result.IdMeal,
                    name = result.StrMeal,
                    category = result.StrCategory,
                    area = result.StrArea,
                    image = result.StrMealThumb,
                    instructions = result.StrInstructions,
                    youtube = result.StrYoutube,
                    ingredients = result.GetIngredients()
                });
            }

            [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
            public IActionResult Error()
            {
                return View();
            }
        }
    }