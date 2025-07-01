window.addEventListener('load', () => {
  const welcomeScreen = document.getElementById('welcome-screen');
  const mainContent = document.getElementById('main-content');

  if (!sessionStorage.getItem('welcomeShown')) {
    sessionStorage.setItem('welcomeShown', 'true');

    setTimeout(() => {
      welcomeScreen.classList.add('hide');
      setTimeout(() => {
        welcomeScreen.style.display = 'none';
        mainContent.style.display = 'block';
      }, 500);
    }, 2000);
  } else {
    welcomeScreen.style.display = 'none';
    mainContent.style.display = 'block';
  }
});
