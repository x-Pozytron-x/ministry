
import './header.css'

export default function Header() {
  return (
    <header className='block header'>
      <div className='header__logo'>
        <img className="" src="App/assets/img/logotype.png" />
      </div>
      <h1 className='header__title'>Please, load DB -&gt;</h1>
      <button className='header__btn' id="db_load">Load DB</button>
      <button className='header__btn' id="db_save">Save DB</button>
    </header>
  )
}