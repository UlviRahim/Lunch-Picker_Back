using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPicker.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "WheelItems");

            migrationBuilder.DropColumn(
                name: "ItemName",
                table: "SpinResults");

            migrationBuilder.RenameColumn(
                name: "SpinTime",
                table: "SpinResults",
                newName: "SpinDate");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "WheelItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "SpinResults",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "SpinResults",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "WheelItemId",
                table: "SpinResults",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_SpinResults_UserId",
                table: "SpinResults",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SpinResults_WheelItemId",
                table: "SpinResults",
                column: "WheelItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_SpinResults_AspNetUsers_UserId",
                table: "SpinResults",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SpinResults_WheelItems_WheelItemId",
                table: "SpinResults",
                column: "WheelItemId",
                principalTable: "WheelItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SpinResults_AspNetUsers_UserId",
                table: "SpinResults");

            migrationBuilder.DropForeignKey(
                name: "FK_SpinResults_WheelItems_WheelItemId",
                table: "SpinResults");

            migrationBuilder.DropIndex(
                name: "IX_SpinResults_UserId",
                table: "SpinResults");

            migrationBuilder.DropIndex(
                name: "IX_SpinResults_WheelItemId",
                table: "SpinResults");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "WheelItems");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "SpinResults");

            migrationBuilder.DropColumn(
                name: "WheelItemId",
                table: "SpinResults");

            migrationBuilder.RenameColumn(
                name: "SpinDate",
                table: "SpinResults",
                newName: "SpinTime");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "WheelItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "SpinResults",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ItemName",
                table: "SpinResults",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }
    }
}
