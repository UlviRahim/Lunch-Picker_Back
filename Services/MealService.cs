using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace LPicker.Services
{
    public class MealService
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

        public MealService()
        {
            _httpClient = new HttpClient();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<Meal?> GetRandomMealAsync()
        {
            try
            {
                var response = await _httpClient.GetStringAsync("https://www.themealdb.com/api/json/v1/1/random.php");
                var data = JsonSerializer.Deserialize<MealResponse>(response, _jsonOptions);
                return data?.Meals?.FirstOrDefault();
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"Error: {ex.Message}");
                return null;
            }
        }

        public async Task<List<Meal>?> SearchMealAsync(string name)
        {
            try
            {
                var response = await _httpClient.GetStringAsync($"https://www.themealdb.com/api/json/v1/1/search.php?s={name}");
                var data = JsonSerializer.Deserialize<MealResponse>(response, _jsonOptions);
                return data?.Meals;
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"Error: {ex.Message}");
                return null;
            }
        }
    }

    public class MealResponse
    {
        public List<Meal>? Meals { get; set; }
    }

    public class Meal
    {
        public string? IdMeal { get; set; }
        public string? StrMeal { get; set; }
        public string? StrCategory { get; set; }
        public string? StrArea { get; set; }
        public string? StrInstructions { get; set; }
        public string? StrMealThumb { get; set; }
        public string? StrYoutube { get; set; }

        public string? StrIngredient1 { get; set; }
        public string? StrIngredient2 { get; set; }
        public string? StrIngredient3 { get; set; }
        public string? StrIngredient4 { get; set; }
        public string? StrIngredient5 { get; set; }
        public string? StrIngredient6 { get; set; }
        public string? StrIngredient7 { get; set; }
        public string? StrIngredient8 { get; set; }
        public string? StrIngredient9 { get; set; }
        public string? StrIngredient10 { get; set; }
        public string? StrIngredient11 { get; set; }
        public string? StrIngredient12 { get; set; }
        public string? StrIngredient13 { get; set; }
        public string? StrIngredient14 { get; set; }
        public string? StrIngredient15 { get; set; }
        public string? StrIngredient16 { get; set; }
        public string? StrIngredient17 { get; set; }
        public string? StrIngredient18 { get; set; }
        public string? StrIngredient19 { get; set; }
        public string? StrIngredient20 { get; set; }

        public string? StrMeasure1 { get; set; }
        public string? StrMeasure2 { get; set; }
        public string? StrMeasure3 { get; set; }
        public string? StrMeasure4 { get; set; }
        public string? StrMeasure5 { get; set; }
        public string? StrMeasure6 { get; set; }
        public string? StrMeasure7 { get; set; }
        public string? StrMeasure8 { get; set; }
        public string? StrMeasure9 { get; set; }
        public string? StrMeasure10 { get; set; }
        public string? StrMeasure11 { get; set; }
        public string? StrMeasure12 { get; set; }
        public string? StrMeasure13 { get; set; }
        public string? StrMeasure14 { get; set; }
        public string? StrMeasure15 { get; set; }
        public string? StrMeasure16 { get; set; }
        public string? StrMeasure17 { get; set; }
        public string? StrMeasure18 { get; set; }
        public string? StrMeasure19 { get; set; }
        public string? StrMeasure20 { get; set; }

        public List<string> GetIngredients()
        {
            var ingredients = new List<string>();
            var props = new[] { StrIngredient1, StrIngredient2, StrIngredient3, StrIngredient4, StrIngredient5,
                               StrIngredient6, StrIngredient7, StrIngredient8, StrIngredient9, StrIngredient10,
                               StrIngredient11, StrIngredient12, StrIngredient13, StrIngredient14, StrIngredient15,
                               StrIngredient16, StrIngredient17, StrIngredient18, StrIngredient19, StrIngredient20 };
            var measures = new[] { StrMeasure1, StrMeasure2, StrMeasure3, StrMeasure4, StrMeasure5,
                                   StrMeasure6, StrMeasure7, StrMeasure8, StrMeasure9, StrMeasure10,
                                   StrMeasure11, StrMeasure12, StrMeasure13, StrMeasure14, StrMeasure15,
                                   StrMeasure16, StrMeasure17, StrMeasure18, StrMeasure19, StrMeasure20 };

            for (int i = 0; i < 20; i++)
            {
                if (!string.IsNullOrWhiteSpace(props[i]))
                {
                    var measure = measures[i]?.Trim() ?? "";
                    var ingredient = props[i]?.Trim() ?? "";
                    ingredients.Add($"{measure} {ingredient}".Trim());
                }
            }
            return ingredients;
        }
    }
}