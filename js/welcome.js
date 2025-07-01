window.addEventListener('load', () => {
  const welcomeScreen = document.getElementById('welcome-screen');
  const mainContent = document.getElementById('main-content');

  setTimeout(() => {
    welcomeScreen.classList.add('hide');
    setTimeout(() => {
      welcomeScreen.style.display = 'none';
      mainContent.style.display = 'block';
    }, 500);
  }, 2000);
});
