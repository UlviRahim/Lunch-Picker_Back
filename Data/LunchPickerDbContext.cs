using LPicker.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LPicker.Data
{
    public class LunchPickerDbContext : IdentityDbContext<AppUser>
    {
        public LunchPickerDbContext(DbContextOptions<LunchPickerDbContext> options) : base(options) { }

        public DbSet<WheelItem> WheelItems { get; set; }
        public DbSet<SpinResult> SpinResults { get; set; }
        public DbSet<PasswordReset> PasswordResets { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}