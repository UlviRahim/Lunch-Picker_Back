using LPicker.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LPicker.Data
{
    public class LunchPickerDbContext : IdentityDbContext<AppUser>
    {
        public LunchPickerDbContext(DbContextOptions<LunchPickerDbContext> options)
            : base(options)
        {
        }

        // Çarx elementləri
        public DbSet<WheelItem> WheelItems { get; set; }

        // Fırlatma nəticələri
        public DbSet<SpinResult> SpinResults { get; set; }
    }
}