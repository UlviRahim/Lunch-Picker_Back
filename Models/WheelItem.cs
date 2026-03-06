using System.ComponentModel.DataAnnotations;

namespace LPicker.Models
{
    public class WheelItem
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        public string? UserId { get; set; }
    }
}