using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace LPicker.Models
{
    public class WheelItem : BaseModel
    {
        [Required, MaxLength(50)]
        public string Name { get; set; }
    }
}