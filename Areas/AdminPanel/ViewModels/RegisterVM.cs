using System.ComponentModel.DataAnnotations;

namespace ViewModels
{
    public class RegisterVM
    {
        [Required(ErrorMessage = "Ad Soyad tələb olunur")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Ad 2-100 simvol arasında olmalıdır")]
        public string FullName { get; set; }

        [Required(ErrorMessage = "İstifadəçi adı tələb olunur")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "İstifadəçi adı 3-50 simvol arasında olmalıdır")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Yalnız hərf, rəqəm və _ istifadə oluna bilər")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Email tələb olunur")]
        [EmailAddress(ErrorMessage = "Düzgün email formatı daxil edin")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Şifrə tələb olunur")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifrə minimum 6 simvol olmalıdır")]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [Required(ErrorMessage = "Şifrə təkrarı tələb olunur")]
        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "Şifrələr uyğun gəlmir")]
        public string ConfirmPassword { get; set; }
    }
}