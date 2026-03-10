using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace LPicker.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetCodeAsync(string email, string code);
    }

    public class EmailService : IEmailService
    {
        private readonly string _smtpHost = "smtp.gmail.com";
        private readonly int _smtpPort = 587;
        private readonly string _smtpUser = "ulvirehimiv@gmail.com";
        private readonly string _smtpPass = "ugvzielvodejeqdg";

        public async Task SendPasswordResetCodeAsync(string email, string code)
        {
            using var client = new SmtpClient(_smtpHost, _smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_smtpUser, _smtpPass)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_smtpUser, "LPicker"),
                Subject = "Şifrə Sıfırlama Kodu",
                Body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #1F2937;'>Şifrə Sıfırlama</h2>
                        <p>Şifrənizi sıfırlamaq üçün təsdiq kodunuz:</p>
                        <div style='background: #F3F4F6; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;'>
                            <span style='color: #10B981; font-size: 36px; font-weight: bold; letter-spacing: 8px;'>{code}</span>
                        </div>
                        <p style='color: #EF4444; font-size: 14px;'>Bu kod 15 dəqiqə ərzində etibarlıdır.</p>
                        <p style='color: #6B7280; font-size: 13px;'>Əgər bu sorğunu etməmisinizsə, bu email-i nəzərə almayın.</p>
                    </div>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(email);
            await client.SendMailAsync(mailMessage);
        }
    }
}