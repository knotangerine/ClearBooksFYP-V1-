using System.Text.Json.Serialization;
using ClearBooksFYP.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Register services with DI container
builder.Services.AddControllers();

// Configure Entity Framework Core to use SQL Server
builder.Services.AddDbContext<ClearBooksDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ClearBooksDatabase")));

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policyBuilder =>
    {
        policyBuilder.WithOrigins("https://localhost:5001", "https://localhost:7103") // API origin and Frontend origin
                     .AllowAnyHeader()
                     .AllowAnyMethod();
    });
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});


// Optional: Add Swagger for API documentation (useful for testing)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build(); // Build the application

app.UseCors("AllowSpecificOrigins");

// Enable serving static files and default files (e.g., index.html)
app.UseDefaultFiles(); // Serve index.html or default.html if present in wwwroot
app.UseStaticFiles();  // Enable serving static files like CSS, JS, etc.

// Set up the middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



app.UseHttpsRedirection();
app.UseAuthorization();

// Map controllers for API endpoints
app.MapControllers();

app.Run();
