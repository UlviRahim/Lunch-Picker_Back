namespace LPicker.Models
{
    public class WheelItem : BaseModel
    {
        public string Name { get; set; }
        public string? UserId { get; set; }
        public AppUser? User { get; set; }
        public bool IsDeleted { get; set; }
    }
}