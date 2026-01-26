MyApp.pages.publishers = {
  render: function () {
    const container = document.getElementById('content-area');
    if (DB_local.select('tbl_publishers')) {
      container.innerHTML = `
        <div class="section__content publishers">
          <div class="tab__content tab__content_active">
            <h2>Publishers <span onclick=document.querySelector('.popupAdd').classList.add('active')> + </span></h2>
            <div class="table">
              <div class="thead">
                <span class="fullname">FullName</span>
                <span class="vps">VPS</span>
                <span class="phone">Phone</span>
                <span class="adres">Adres</span>
                <span class="birthday">Birthday</span>
                <span class="baptismday">Baptisted</span>
                <span class="gender">🚻</span>
                <span class="hope">🐑</span>
                <span class="isElder">👨‍🏫</span>
                <span class="isServant">🤝</span>
                <span class="isPioner">50</span>
                <span class="isSpecial">90</span>
                <span class="isMissioner">🌍</span>
              </div>
              <div class="tbody" id="table_publishers">
                ${get_publishers()}
              </div>
            </div>
          </div>
        </div>


        
        <div class="popupAdd" style="z-index: 99">
          <span class="popup_close" onclick=document.querySelector('.popupAdd').classList.remove('active')>X</span>
          <h2>Add Publisher</h2>
          <section>
            <label>
              <span>Name</span>
              <input type="text" id="publisherName">
            </label>
            <label>
              <span>Surname</span> 
              <input type="text" id="publisherSurname">
            </label>
            <label>
              <span>Phone</span>
              <input type="number" id="publisherPhone">
            </label>
            <label>
              <span>Adres</span> 
              <input type="text" id="publisherAdres">
            </label>
            <label>
              <span>Birthday</span> 
              <input type="text" id="publisherBirthday">
            </label>
            <label>
              <span>Baptised</span> 
              <input type="text" id="publisherBaptised">
            </label>
            <label>
              <span>Gender</span> 
              <select id="publisherGender">
                <option value="male">🚹</option>
                <option value="female">🚺</option>
              </select>
            </label>
            <label>
              <span>Hope</span> 
              <select id="publisherHope">
                <option value="OS">Other sheep</option>
                <option value="SH">Sky Hope</option>
              </select>
            </label>
            <label>
              <span>Elder</span> 
              <input type="checkbox" id="publisherElder">
            </label>
            <label>
              <span>Servant</span> 
              <input type="checkbox" id="publisherServant">
            </label>
            <label>
              <span>Pioner</span> 
              <input type="checkbox" id="publisherPioner">
            </label>
            <label>
              <span>Special</span> 
              <input type="checkbox" id="publisherSpecial">
            </label>
            <label>
              <span>Missioner</span> 
              <input type="checkbox" id="publisherMissioner">
            </label>
            
            <button onclick="publisher_add()">Add publisher</button>
          </section>
          
        </div>
      `;
    } else {
      container.innerHTML = `please load db`;
    }
  }

}

function get_publishers() {
  if (!DB_local.select('tbl_publishers')) {
    arr_publ = "";
  } else {
    let arr_publishers = DB_local.select('tbl_publishers');
    arr_publishers = Object.entries(arr_publishers).map(([id, item]) => ({ id: parseInt(id), ...item }));

    arr_publishers.sort((a, b) => {
      const valA = a['surname'] || '';
      const valB = b['surname'] || '';
      return valA.localeCompare(valB) * 1;
    });
    arr_publ = "";
    for (const publisher in arr_publishers) {
      let row = arr_publishers[publisher];

      arr_publ += "<div class='row' onclick='popupEdit(this)' data-publisher_id='" + row.id + "'>";

      row.gender = (row.gender == 'male') ? '🚹' : '🚺';
      row.hope = (row.hope == 'OS') ? '🌐' : '☁';
      const isCkd = (check) => check ? '☑' : '☐';

      arr_publ += `
        <span class="fullname">${row.surname} ${row.name}</span>
        <span class="vps">0</span>
        <span class="phone">${row.phone ? row.phone : '-'}</span>
        <span class="adres">${row.adres}</span>
        <span class="birthday">${row.birthday}</span>
        <span class="baptismday">${row.baptismday ? row.baptismday : '-'}</span>
        <span class="gender">${row.gender}</span>
        <span class="hope">${row.hope}</span>
        <span class="isElder">${isCkd(row.isElder)}</span>
        <span class="isServant">${isCkd(row.isServant)}</span>
        <span class="isPioner">${isCkd(row.isPioner)}</span>
        <span class="isSpecial">${isCkd(row.isSpecial)}</span>
        <span class="isMissioner">${isCkd(row.isMissioner)}</span>
      `;
      arr_publ += "</div>";
    }
  }
  return arr_publ;
}

function publisher_add() {
  let lastPublisherID = Number(Object.keys(DB_local.select("tbl_publishers"))[Object.keys(DB_local.select("tbl_publishers")).length - 1]) + 1;

  let publisher = {
    [lastPublisherID]: {
      "surname": document.getElementById('publisherSurname').value.trim(),
      "name": document.getElementById('publisherName').value.trim(),
      "phone": document.getElementById('publisherPhone').value.trim(),
      "adres": document.getElementById('publisherAdres').value.trim(),
      "birthday": document.getElementById('publisherBirthday').value.trim(),
      "baptismday": document.getElementById('publisherBaptised').value.trim(),
      "gender": document.getElementById('publisherGender').value.trim(),
      "hope": document.getElementById('publisherHope').value.trim(),
      "isElder": document.getElementById('publisherElder').checked,
      "isServant": document.getElementById('publisherServant').checked,
      "isPioner": document.getElementById('publisherPioner').checked,
      "isSpecial": document.getElementById('publisherSpecial').checked,
      "isMissioner": document.getElementById('publisherMissioner').checked
    }
  };
  DB_local.insert("tbl_publishers", publisher);
  MyApp.pages.publishers.render();
}

function publisher_delete(id) {
  DB_local.delete("tbl_publishers", id);
  document.querySelector('.popupEdit').remove()
  MyApp.pages.publishers.render();
}

function popupEdit(e) {
  let publisher = DB_local.select('tbl_publishers', e.dataset.publisher_id)

  let genderMale = (publisher.gender == 'male') ? 'selected' : '';
  let genderFemale = (publisher.gender == 'female') ? 'selected' : '';
  let hopeOS = (publisher.hope == 'OS') ? 'selected' : '';
  let hopeSH = (publisher.hope == 'SH') ? 'selected' : '';

  let content = `
        
          <span class="popup_close" onclick=document.querySelector('.popupEdit').remove()>X</span>
          <h2>${publisher.surname} ${publisher.name}</h2>
          <section>
            <label>
              <span>Name</span>
              <input type="text" id="edit_publisherName" value="${publisher.name}">
            </label>
            <label>
              <span>Surname</span> 
              <input type="text" id="edit_publisherSurname" value="${publisher.surname}">
            </label>
            <label>
              <span>Phone</span>
              <input type="number" id="edit_publisherPhone" value="${publisher.phone}">
            </label>
            <label>
              <span>Adres</span> 
              <input type="text" id="edit_publisherAdres" value="${publisher.adres}">
            </label>
            <label>
              <span>Birthday</span> 
              <input type="text" id="edit_publisherBirthday" value="${publisher.birthday}">
            </label>
            <label>
              <span>Baptised</span> 
              <input type="text" id="edit_publisherBaptised" value="${publisher.baptismday}">
            </label>
            <label>
              <span>Gender</span> 
              <select id="edit_publisherGender">
                <option value="male" ${genderMale} >🚹</option>
                <option value="female"  ${genderFemale} >🚺</option>
              </select>
            </label>
            <label>
              <span>Hope</span> 
              <select id="edit_publisherHope">
                <option value="OS" ${hopeOS}>Other sheep</option>
                <option value="SH" ${hopeSH}>Sky Hope</option>
              </select>
            </label>
            <label>
              <span>Elder</span> 
              <input type="checkbox" id="edit_publisherElder" ${(publisher.isElder) ? 'checked' : ''}>
            </label>
            <label>
              <span>Servant</span> 
              <input type="checkbox" id="edit_publisherServant" ${(publisher.isServant) ? 'checked' : ''}>
            </label>
            <label>
              <span>Pioner</span> 
              <input type="checkbox" id="edit_publisherPioner" ${(publisher.isPioner) ? 'checked' : ''}>
            </label>
            <label>
              <span>Special</span> 
              <input type="checkbox" id="edit_publisherSpecial" ${(publisher.isSpecial) ? 'checked' : ''}>
            </label>
            <label>
              <span>Missioner</span> 
              <input type="checkbox" id="edit_publisherMissioner" ${(publisher.isMissioner) ? 'checked' : ''}>
            </label>
            
            <button onclick="publisher_delete(${e.dataset.publisher_id})">DELETE</button>
            <button onclick="publisher_save(${e.dataset.publisher_id})">Save publisher</button>
          </section>
  `;

  let popupEdit = document.createElement('div');
  popupEdit.classList.add('popupEdit');
  popupEdit.classList.add('active');
  popupEdit.innerHTML = content;
  document.querySelector('body').appendChild(popupEdit);
}

function publisher_save(id) {
  let publisher = {
    "surname": document.getElementById('edit_publisherSurname').value.trim(),
    "name": document.getElementById('edit_publisherName').value.trim(),
    "phone": document.getElementById('edit_publisherPhone').value.trim(),
    "adres": document.getElementById('edit_publisherAdres').value.trim(),
    "birthday": document.getElementById('edit_publisherBirthday').value.trim(),
    "baptismday": document.getElementById('edit_publisherBaptised').value.trim(),
    "gender": document.getElementById('edit_publisherGender').value.trim(),
    "hope": document.getElementById('edit_publisherHope').value.trim(),
    "isElder": document.getElementById('edit_publisherElder').checked,
    "isServant": document.getElementById('edit_publisherServant').checked,
    "isPioner": document.getElementById('edit_publisherPioner').checked,
    "isSpecial": document.getElementById('edit_publisherSpecial').checked,
    "isMissioner": document.getElementById('edit_publisherMissioner').checked
  };

  let tbl = DB_local.select("tbl_publishers");
  tbl[id] = publisher;
  DB_local.update("tbl_publishers", tbl);
  document.querySelector('.popupEdit').remove()
  MyApp.pages.publishers.render();
}
