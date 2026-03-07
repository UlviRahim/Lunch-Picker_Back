using LPicker.Models;
using LPicker.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace LPicker.Controllers
{
    public class AccountController : Controller
    {
        private SignInManager<AppUser> _signInManager { get; }
        private UserManager<AppUser> _userManager { get; }
        private RoleManager<IdentityRole> _roleManager { get; }

        public AccountController(SignInManager<AppUser> signInManager,
                                 UserManager<AppUser> userManager,
                                 RoleManager<IdentityRole> roleManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _roleManager = roleManager;
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