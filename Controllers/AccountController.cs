using LPicker.Data;
using LPicker.Models;
using LPicker.Services;
using LPicker.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace LPicker.Controllers
{
    public class AccountController : Controller
    {
        private SignInManager<AppUser> _signInManager { get; }
        private UserManager<AppUser> _userManager { get; }
        private RoleManager<IdentityRole> _roleManager { get; }
        private readonly IEmailService _emailService;
        private readonly LunchPickerDbContext _context;

        public AccountController(SignInManager<AppUser> signInManager,
                                 UserManager<AppUser> userManager,
                                 RoleManager<IdentityRole> roleManager,
                                 IEmailService emailService,
                                 LunchPickerDbContext context)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _roleManager = roleManager;
            _emailService = emailService;
            _context = context;
        }

        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterVM user)
        {
            if (!ModelState.IsValid) return View(user);

            AppUser newUser = new()
            {
                FullName = user.FullName,
                UserName = user.Username,
                Email = user.Email,
            };

            IdentityResult result = await _userManager.CreateAsync(newUser, user.Password);

            if (!result.Succeeded)
            {
                foreach (IdentityError error in result.Errors)
                {
                    ModelState.AddModelError("", error.Description);
                }
                return View(user);
            }

            await _userManager.AddToRoleAsync(newUser, "Member");
            await _signInManager.SignInAsync(newUser, true);
            return RedirectToAction("Index", "Home");
        }

        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginVM user)
        {
            if (!ModelState.IsValid) return View(user);

            AppUser? existUser = await _userManager.FindByEmailAsync(user.Email);

            if (existUser == null)
            {
                ModelState.AddModelError("", "Username or password is incorrect");
                return View(user);
            }

            var signInResult = await _signInManager.PasswordSignInAsync(existUser, user.Password, true, true);

            if (signInResult.IsLockedOut)
            {
                ModelState.AddModelError("", "Try again later");
                return View(user);
            }

            if (!signInResult.Succeeded)
            {
                ModelState.AddModelError("", "Username or password is incorrect");
                return View(user);
            }

            return RedirectToAction("Index", "Home");
        }

        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordVM model)
        {
            if (!ModelState.IsValid) return View(model);

            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
            {
                return RedirectToAction("ForgotPasswordConfirmation");
            }

            var random = new System.Random();
            var code = random.Next(100000, 999999).ToString();

            var passwordReset = new PasswordReset
            {
                Email = model.Email,
                Code = code,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IsUsed = false
            };

            _context.PasswordResets.Add(passwordReset);
            await _context.SaveChangesAsync();

            await _emailService.SendPasswordResetCodeAsync(model.Email, code);

            TempData["ResetEmail"] = model.Email;

            return RedirectToAction("ForgotPasswordConfirmation");
        }

        [HttpGet]
        public IActionResult ForgotPasswordConfirmation()
        {
            return View();
        }

        [HttpGet]
        public IActionResult ResetPassword(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                email = TempData["ResetEmail"]?.ToString();
            }

            if (string.IsNullOrEmpty(email)) return BadRequest();

            var model = new ResetPasswordVM { Email = email };
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(ResetPasswordVM model)
        {
            if (!ModelState.IsValid) return View(model);

            var resetRecord = _context.PasswordResets
                .Where(r => r.Email == model.Email && r.Code == model.Code && !r.IsUsed)
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefault();

            if (resetRecord == null)
            {
                ModelState.AddModelError("", "Kod yanlışdır və ya istifadə edilib");
                return View(model);
            }

            if (resetRecord.ExpiresAt < DateTime.UtcNow)
            {
                ModelState.AddModelError("", "Kodun müddəti bitib");
                return View(model);
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return RedirectToAction("Login");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);

            if (result.Succeeded)
            {
                resetRecord.IsUsed = true;
                await _context.SaveChangesAsync();

                return RedirectToAction("ResetPasswordSuccess");
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError("", error.Description);
            }

            return View(model);
        }

        [HttpGet]
        public IActionResult ResetPasswordSuccess()
        {
            return View();
        }

        public async Task<IActionResult> CreateRoles()
        {
            if (!await _roleManager.RoleExistsAsync("SuperAdmin"))
                await _roleManager.CreateAsync(new IdentityRole("SuperAdmin"));

            if (!await _roleManager.RoleExistsAsync("Admin"))
                await _roleManager.CreateAsync(new IdentityRole("Admin"));

            if (!await _roleManager.RoleExistsAsync("Member"))
                await _roleManager.CreateAsync(new IdentityRole("Member"));

            return Content("Roles created");
        }
    }
}