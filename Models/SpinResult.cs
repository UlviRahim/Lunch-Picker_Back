namespace LPicker.Models
{
    public class SpinResult : BaseModel
    {
        public string? UserId { get; set; }
        public AppUser? User { get; set; }
        public int WheelItemId { get; set; }
        public WheelItem? WheelItem { get; set; }
        public DateTime SpinDate { get; set; } = DateTime.Now;
    }
}