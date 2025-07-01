window.addEventListener('load', () => {
  const welcomeScreen = document.getElementById('welcome-screen');
  const logoPopup = document.getElementById('logo-popup');
  const mainContent = document.getElementById('main-content');

  if (!sessionStorage.getItem('welcomeShown')) {
    sessionStorage.setItem('welcomeShown', 'true');

    setTimeout(() => {
      welcomeScreen.classList.add('hide');

      setTimeout(() => {
        welcomeScreen.style.display = 'none';

        logoPopup.classList.add('show');

        setTimeout(() => {
          logoPopup.classList.add('hide');

          setTimeout(() => {
            logoPopup.style.display = 'none';
            mainContent.style.display = 'block';
          }, 500);

        }, 2500);
      }, 500);

    }, 2000);

  } else {
    welcomeScreen.style.display = 'none';
    logoPopup.style.display = 'none';
    mainContent.style.display = 'block';
  }
});
