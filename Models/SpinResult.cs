using System.ComponentModel.DataAnnotations;

namespace LPicker.Models
{
    public class SpinResult
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string ItemName { get; set; } = string.Empty;

        public DateTime SpinTime { get; set; }

        public string? UserId { get; set; }
    }
}