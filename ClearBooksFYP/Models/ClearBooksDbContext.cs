using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ClearBooksFYP.Models
{
    public class ClearBooksDbContext : DbContext
    {
        public ClearBooksDbContext(DbContextOptions<ClearBooksDbContext> options)
            : base(options)
        {
        }

        public DbSet<ChartOfAccount> ChartOfAccounts { get; set; }
        public DbSet<GLMapping> GLMappings { get; set; }
        public DbSet<VoucherHeader> VoucherHeaders { get; set; }
        public DbSet<VoucherDetail> VoucherDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // GL Mapping relationships
            modelBuilder.Entity<GLMapping>()
                .HasOne<ChartOfAccount>()
                .WithMany()
                .HasForeignKey(m => m.DebitAccount)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GLMapping>()
                .HasOne<ChartOfAccount>()
                .WithMany()
                .HasForeignKey(m => m.CreditAccount)
                .OnDelete(DeleteBehavior.Restrict);

            // Voucher relationships
            modelBuilder.Entity<VoucherHeader>()
                .HasMany(vh => vh.VoucherDetails)
                .WithOne(vd => vd.VoucherHeader)
                .HasForeignKey(vd => vd.VoucherId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<VoucherDetail>()
                .HasOne(vd => vd.VoucherHeader)
                .WithMany(vh => vh.VoucherDetails)
                .HasForeignKey(vd => vd.VoucherId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            modelBuilder.Entity<VoucherDetail>()
                .HasOne(vd => vd.ChartOfAccount)
                .WithMany()
                .HasForeignKey(vd => vd.AccountId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        }
    }

    [Table("chart_of_accounts")]
    public class ChartOfAccount
    {
        [Key]
        [Column("account_id")]
        public int AccountId { get; set; }

        [Column("account_number")]
        [Required]
        public string AccountNumber { get; set; }

        [Column("account_name")]
        [Required]
        public string AccountName { get; set; }

        [Column("account_type")]
        [Required]
        public string AccountType { get; set; }

        [Column("parent_account")]
        public int? ParentAccount { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }

    [Table("gl_mappings")]
    public class GLMapping
    {
        [Key]
        [Column("mapping_id")]
        public int MappingId { get; set; }

        [Required]
        [Column("transaction_type")]
        public string TransactionType { get; set; }

        [Required]
        [Column("debit_account")]
        public int DebitAccount { get; set; }

        [Required]
        [Column("credit_account")]
        public int CreditAccount { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }

    [Table("voucher_header")]
    public class VoucherHeader
    {
        [Key]
        [Column("voucher_id")]
        public int VoucherId { get; set; }

        [Required]
        [Column("voucher_number")]
        public string VoucherNumber { get; set; }

        [Required]
        [Column("voucher_date")]
        public DateTime VoucherDate { get; set; }

        [Required]
        [Column("transaction_type")]
        public string TransactionType { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Required]
        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        [Column("status")]
        public string Status { get; set; } = "Pending";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        public virtual ICollection<VoucherDetail> VoucherDetails { get; set; }
    }

    [Table("voucher_detail")]
    public class VoucherDetail
    {
        [Key]
        [Column("detail_id")]
        public int DetailId { get; set; }

        [Required]
        [Column("voucher_id")]
        public int VoucherId { get; set; }

        [Required]
        [Column("account_id")]
        public int AccountId { get; set; }

        [Required]
        [Column("is_debit")]
        public bool IsDebit { get; set; }

        [Required]
        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        public virtual VoucherHeader? VoucherHeader { get; set; }
        public virtual ChartOfAccount? ChartOfAccount { get; set; }
    }
}
