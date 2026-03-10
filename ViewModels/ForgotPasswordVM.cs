using System.ComponentModel.DataAnnotations;

namespace LPicker.ViewModels
{
    public class ForgotPasswordVM
    {
        [Required(ErrorMessage = "Email mütləqdir")]
        [EmailAddress(ErrorMessage = "Email formatı düzgün deyil")]
        public string Email { get; set; }
    }
}