using System;
using ClearBooksFYP.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace ClearBooksFYP.Migrations
{
    [DbContext(typeof(ClearBooksDbContext))]
    partial class ClearBooksDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("ClearBooksFYP.Models.ChartOfAccount", b =>
            {
                b.Property<int>("AccountId")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int")
                    .HasColumnName("account_id");

                SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("AccountId"));

                b.Property<string>("AccountName")
                    .IsRequired()
                    .HasColumnType("nvarchar(max)")
                    .HasColumnName("account_name");

                b.Property<string>("AccountNumber")
                    .IsRequired()
                    .HasColumnType("nvarchar(max)")
                    .HasColumnName("account_number");

                b.Property<string>("AccountType")
                    .IsRequired()
                    .HasColumnType("nvarchar(max)")
                    .HasColumnName("account_type");

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("datetime2")
                    .HasColumnName("created_at");

                b.Property<string>("Description")
                    .IsRequired()
                    .HasColumnType("nvarchar(max)")
                    .HasColumnName("description");

                b.Property<int?>("ParentAccount")
                    .HasColumnType("int")
                    .HasColumnName("parent_account");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("datetime2")
                    .HasColumnName("updated_at");

                b.HasKey("AccountId");

                b.ToTable("chart_of_accounts");
            });

            modelBuilder.Entity("ClearBooksFYP.Models.GLMapping", b =>
            {
                b.Property<int>("MappingId")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int")
                    .HasColumnName("mapping_id");

                SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("MappingId"));

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("datetime2")
                    .HasColumnName("created_at");

                b.Property<int>("CreditAccount")
                    .HasColumnType("int")
                    .HasColumnName("credit_account");

                b.Property<int>("DebitAccount")
                    .HasColumnType("int")
                    .HasColumnName("debit_account");

                b.Property<string>("TransactionType")
                    .IsRequired()
                    .HasColumnType("nvarchar(max)")
                    .HasColumnName("transaction_type");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("datetime2")
                    .HasColumnName("updated_at");

                b.HasKey("MappingId");

                b.HasIndex("CreditAccount");

                b.HasIndex("DebitAccount");

                b.ToTable("gl_mappings");
            });

            modelBuilder.Entity("ClearBooksFYP.Models.VoucherHeader", b =>
            {
                b.Property<int>("VoucherId")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int")
                    .HasColumnName("voucher_id");

                SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("VoucherId"));

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("datetime2")
                    .HasColumnName("created_at");

                b.Property<string>("Description")
                    .HasColumnType("nvarchar(max)")
                    .HasColumnName("description");

                b.Property<string>("Status")
                    .HasColumnType("nvarchar(20)")
                    .HasColumnName("status");

                b.Property<decimal>("TotalAmount")
                    .HasColumnType("decimal(18,2)")
                    .HasColumnName("total_amount");

                b.Property<string>("TransactionType")
                    .IsRequired()
                    .HasColumnType("nvarchar(50)")
                    .HasColumnName("transaction_type");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("datetime2")
                    .HasColumnName("updated_at");

                b.Property<DateTime>("VoucherDate")
                    .HasColumnType("date")
                    .HasColumnName("voucher_date");

                b.Property<string>("VoucherNumber")
                    .IsRequired()
                    .HasColumnType("nvarchar(50)")
                    .HasColumnName("voucher_number");

                b.HasKey("VoucherId");

                b.ToTable("voucher_header");
            });

            modelBuilder.Entity("ClearBooksFYP.Models.VoucherDetail", b =>
            {
                b.Property<int>("DetailId")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int")
                    .HasColumnName("detail_id");

                SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("DetailId"));

                b.Property<int>("AccountId")
                    .HasColumnType("int")
                    .HasColumnName("account_id");

                b.Property<decimal>("Amount")
                    .HasColumnType("decimal(18,2)")
                    .HasColumnName("amount");

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("datetime2")
                    .HasColumnName("created_at");

                b.Property<string>("Description")
                    .HasColumnType("nvarchar(max)")
                    .HasColumnName("description");

                b.Property<bool>("IsDebit")
                    .HasColumnType("bit")
                    .HasColumnName("is_debit");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("datetime2")
                    .HasColumnName("updated_at");

                b.Property<int>("VoucherId")
                    .HasColumnType("int")
                    .HasColumnName("voucher_id");

                b.HasKey("DetailId");

                b.HasIndex("AccountId");

                b.HasIndex("VoucherId");

                b.ToTable("voucher_detail");
            });

            modelBuilder.Entity("ClearBooksFYP.Models.GLMapping", b =>
            {
                b.HasOne("ClearBooksFYP.Models.ChartOfAccount", null)
                    .WithMany()
                    .HasForeignKey("CreditAccount")
                    .OnDelete(DeleteBehavior.Restrict)
                    .IsRequired();

                b.HasOne("ClearBooksFYP.Models.ChartOfAccount", null)
                    .WithMany()
                    .HasForeignKey("DebitAccount")
                    .OnDelete(DeleteBehavior.Restrict)
                    .IsRequired();
            });

            modelBuilder.Entity("ClearBooksFYP.Models.VoucherDetail", b =>
            {
                b.HasOne("ClearBooksFYP.Models.ChartOfAccount", "ChartOfAccount")
                    .WithMany()
                    .HasForeignKey("AccountId")
                    .OnDelete(DeleteBehavior.Restrict)
                    .IsRequired();

                b.HasOne("ClearBooksFYP.Models.VoucherHeader", "VoucherHeader")
                    .WithMany("VoucherDetails")
                    .HasForeignKey("VoucherId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.Navigation("ChartOfAccount");

                b.Navigation("VoucherHeader");
            });

            modelBuilder.Entity("ClearBooksFYP.Models.VoucherHeader", b =>
            {
                b.Navigation("VoucherDetails");
            });


#pragma warning restore 612, 618
        }
            
    }
}