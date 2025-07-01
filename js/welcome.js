window.addEventListener('load', () => {
  const welcomeScreen = document.getElementById('welcome-screen');
  const logoPopup = document.getElementById('logo-popup');
  const mainContent = document.getElementById('main-content');

  if (!sessionStorage.getItem('welcomeShown')) {
    sessionStorage.setItem('welcomeShown', 'true');

    setTimeout(() => {
      welcomeScreen.classList.add('hide-opacity');

      setTimeout(() => {
        welcomeScreen.style.display = 'none';
        logoPopup.style.display = 'flex';
        logoPopup.classList.remove('hide-opacity');

        setTimeout(() => {
          logoPopup.classList.add('hide-opacity');

          setTimeout(() => {
            logoPopup.style.display = 'none';
            mainContent.style.display = 'block';
          }, 700);
        }, 2500);
      }, 700);
    }, 2000);

  } else {
    welcomeScreen.style.display = 'none';
    logoPopup.style.display = 'none';
    mainContent.style.display = 'block';
  }
});
