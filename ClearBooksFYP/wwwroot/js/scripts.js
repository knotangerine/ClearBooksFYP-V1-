// Example to highlight the active menu item
document.querySelectorAll('.sidebar-menu a').forEach(item => {
    item.addEventListener('click', function () {
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        item.classList.add('active');
    });
});
