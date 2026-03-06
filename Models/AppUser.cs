using Microsoft.AspNetCore.Identity;

namespace LPicker.Models
{
    public class AppUser : IdentityUser
    {
        public string? FullName { get; set; }
    }
}