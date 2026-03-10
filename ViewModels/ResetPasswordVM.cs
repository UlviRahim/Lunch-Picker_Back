using System.ComponentModel.DataAnnotations;

namespace LPicker.ViewModels
{
    public class ResetPasswordVM
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Kod 6 rəqəmli olmalıdır")]
        public string Code { get; set; }

        [Required(ErrorMessage = "Yeni şifrə mütləqdir")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifrə ən azı 6 simvol olmalıdır")]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; }

        [DataType(DataType.Password)]
        [Compare("NewPassword", ErrorMessage = "Şifrələr eyni deyil")]
        public string ConfirmPassword { get; set; }
    }
}