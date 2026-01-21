function initNavigation() {

  document.querySelectorAll('.menu__item').forEach(btn => {
    btn.addEventListener('click', e => {
      const section = e.target.dataset.section;
      MyApp.setState({ currentSection: section });

      MyApp.router.navigate(section);
    });
  });
}