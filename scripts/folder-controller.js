/* global window, document, previewFields, defaultFields, sendSample, sendCustom, applyAppearance, applyImportedPreset, __INTERLESS_FIELDS_SLOT__ */
const packApi = window.InterlessChat;
const packStatus = document.getElementById('dino-pack-status');
const exportFields = __INTERLESS_FIELDS_SLOT__;
function refreshPackGallery() {
  const gallery = document.getElementById('dino-gallery');
  gallery.replaceChildren();
  const empty = Object.keys(packApi.catalog).length === 0;
  document.getElementById('random-dinosaurs').disabled = empty;
  document.getElementById('dino-pack-reset').disabled = empty;
  if (empty) {
    const note = document.createElement('p');
    note.textContent =
      'Динозаврики не загружены. Выбери свою папку или файлы — они появятся здесь и в чате.';
    gallery.append(note);
  }
  for (const [id, item] of Object.entries(packApi.catalog)) {
    const card = document.createElement('div');
    card.className = 'dino-card';
    card.dataset.characterCard = id;
    const frame = document.createElement('span');
    frame.className = 'dino-thumb';
    for (const [key, value] of Object.entries(packApi.characterFrame(id)))
      frame.style.setProperty(key, value);
    const url = packApi.characterUrl(id);
    const media = document.createElement(packApi.isVideoUrl(url, item.mediaType) ? 'video' : 'img');
    media.src = url;
    if (media.tagName === 'VIDEO') {
      media.muted = true;
      media.autoplay = true;
      media.loop = true;
      media.playsInline = true;
      media.disablePictureInPicture = true;
      media.setAttribute('aria-label', item.name);
    } else media.alt = item.name;
    frame.append(media);
    const name = document.createElement('strong');
    name.textContent = item.name;
    const choose = document.createElement('button');
    choose.type = 'button';
    choose.textContent = '!' + (item.command ?? id);
    choose.dataset.chooseCharacter = id;
    choose.onclick = () => sendCustom('!' + (packApi.catalog[id].command ?? id));
    const commandForm = document.createElement('form');
    commandForm.dataset.commandForm = id;
    const label = document.createElement('label');
    label.htmlFor = 'dino-command-' + id;
    label.textContent = 'Команда';
    const input = document.createElement('input');
    input.id = label.htmlFor;
    input.type = 'text';
    input.value = '!' + (item.command ?? id);
    input.maxLength = 33;
    input.required = true;
    input.autocomplete = 'off';
    input.spellcheck = false;
    const save = document.createElement('button');
    save.type = 'submit';
    save.textContent = 'Изменить команду';
    const error = document.createElement('small');
    error.id = 'dino-command-error-' + id;
    error.setAttribute('role', 'status');
    input.setAttribute('aria-describedby', error.id);
    commandForm.onsubmit = (event) => {
      event.preventDefault();
      try {
        packApi.updateCharacterCommand(id, input.value);
        refreshPackGallery();
        applyAppearance();
        packStatus.textContent =
          'Команда изменена на !' +
          packApi.catalog[id].command +
          '. Сохрани проект или скопируй код для StreamElements.';
      } catch (cause) {
        error.textContent = cause.message;
        input.setAttribute('aria-invalid', 'true');
      }
    };
    input.oninput = () => {
      error.textContent = '';
      input.removeAttribute('aria-invalid');
    };
    label.append(input);
    commandForm.append(label, save, error);
    card.append(frame, name, choose, commandForm);
    gallery.append(card);
  }
  document.getElementById('bot-help').textContent = packApi.dinosaurHelp();
}
refreshPackGallery();
document.getElementById('random-dinosaurs').onclick = () => {
  const ids = Object.keys(packApi.catalog);
  for (let n = ids.length - 1; n > 0; n--) {
    const j = Math.floor(Math.random() * (n + 1));
    [ids[n], ids[j]] = [ids[j], ids[n]];
  }
  if (!document.querySelector('[data-message-id]')) {
    sendSample();
    sendSample();
    sendSample();
  }
  window.dispatchEvent(
    new CustomEvent('interless:preview-characters', { detail: { characterIds: ids } }),
  );
};
document.getElementById('choose-dino-folder').onclick = () =>
  document.getElementById('dino-folder').click();
document.getElementById('choose-dino-files').onclick = () =>
  document.getElementById('dino-files').click();
async function loadDinosaurFiles(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  const controls = [
    'choose-dino-folder',
    'choose-dino-files',
    'dino-pack-export',
    'copy-html',
    'copy-css',
    'copy-js',
    'copy-fields',
    'project-save',
    'project-file',
    'dino-pack-reset',
  ].map((id) => document.getElementById(id));
  controls.forEach((c) => (c.disabled = true));
  packStatus.textContent = 'Читаю анимации…';
  try {
    const pack = await packApi.importCharacterFolder(files);
    packApi.installCharacterPack(pack);
    previewFields.dinosaurCatalog = JSON.stringify(
      Object.fromEntries(
        Object.entries(packApi.catalog).map(([id, item]) => [id, { name: item.name, url: '' }]),
      ),
    );
    refreshPackGallery();
    applyAppearance();
    const ids = Object.keys(pack.characters);
    if (!document.querySelector('[data-message-id]')) sendSample();
    window.dispatchEvent(
      new CustomEvent('interless:preview-characters', { detail: { characterIds: ids } }),
    );
    packStatus.textContent =
      'Загружено ' +
      ids.length +
      ': ' +
      ids.map((id) => '!' + id).join(', ') +
      '. Скопируй HTML/CSS/JS/FIELDS, затем выбери эти файлы в медиатеке StreamElements.';
  } catch (error) {
    packStatus.textContent = 'Не загружено: ' + error.message;
  } finally {
    controls.forEach((c) => (c.disabled = false));
    refreshPackGallery();
    event.target.value = '';
  }
}
document.getElementById('dino-folder').onchange = loadDinosaurFiles;
document.getElementById('dino-files').onchange = loadDinosaurFiles;
document.getElementById('dino-pack-reset').onclick = () => {
  packApi.installCharacterPack(null);
  previewFields.dinosaurCatalog = defaultFields.dinosaurCatalog;
  refreshPackGallery();
  applyAppearance();
  window.dispatchEvent(
    new CustomEvent('interless:preview-characters', {
      detail: { characterIds: Object.keys(packApi.catalog) },
    }),
  );
  packStatus.textContent = 'Загруженные персонажи удалены. Оформление сохранено.';
};
const exportStatus = document.getElementById('widget-export-status');
const copyButtons = Array.from(document.querySelectorAll('[data-copy-tab]'));
const copyFallback = document.getElementById('copy-fallback');
const copyCode = document.getElementById('copy-code');
let settingsRevision = 0;
let hasCopiedCode = false;
window.addEventListener('interless:preview-settings-changed', () => {
  settingsRevision++;
  copyFallback.hidden = true;
  copyCode.value = '';
  if (hasCopiedCode) {
    exportStatus.textContent =
      'Настройки изменились. Скопируй четыре вкладки заново, чтобы перенести текущее оформление.';
    hasCopiedCode = false;
  }
});
function selectCopyCode() {
  copyCode.focus();
  copyCode.select();
}
document.getElementById('copy-select').onclick = selectCopyCode;
for (const button of copyButtons)
  button.onclick = async () => {
    const tab = button.dataset.copyTab;
    const revision = settingsRevision;
    let code;
    try {
      code = packApi.createStreamElementsCode({
        pack: packApi.getCharacterPack(),
        bundle: document.getElementById('interless-runtime').textContent,
        css: document.getElementById('interless-widget-css').textContent,
        fields: exportFields,
        settings: previewFields,
      })[tab];
    } catch (error) {
      exportStatus.textContent = 'Не удалось подготовить код: ' + error.message;
      return;
    }
    copyButtons.forEach((control) => (control.disabled = true));
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code);
      copyFallback.hidden = true;
      copyCode.value = '';
      exportStatus.textContent =
        'Код ' +
        tab +
        ' скопирован. Вставь во вкладку ' +
        tab +
        ' в StreamElements (Ctrl+A, затем Ctrl+V).';
    } catch {
      if (revision === settingsRevision) {
        copyFallback.hidden = false;
        copyCode.value = code;
        document.getElementById('copy-code-label').textContent = 'Код для вкладки ' + tab;
        selectCopyCode();
        exportStatus.textContent =
          'Браузер не дал доступ к буферу. Код ' +
          tab +
          ' выделен ниже — нажми Ctrl+C и вставь во вкладку ' +
          tab +
          '.';
      }
    } finally {
      hasCopiedCode = true;
      if (revision !== settingsRevision)
        exportStatus.textContent =
          'Настройки изменились во время копирования. Нажми нужную вкладку ещё раз.';
      copyButtons.forEach((control) => (control.disabled = false));
    }
  };
document.getElementById('dino-pack-export').onclick = () => {
  const section = document.getElementById('transfer-editor');
  section.open = true;
  section.scrollIntoView?.({ block: 'nearest' });
  document.getElementById('copy-html').focus();
};
document.getElementById('project-save').onclick = () => {
  const code = packApi.encodeProject(previewFields, packApi.getCharacterPack());
  const url = URL.createObjectURL(new Blob([code], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'interless-chat-project.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  exportStatus.textContent =
    'Проект сохранён: оформление и загруженные анимации. Открой этот JSON через «Открыть проект».';
};
document.getElementById('project-file').onchange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 100 * 1024 * 1024) throw new Error('Файл проекта слишком большой.');
    const project = packApi.decodeProject(await file.text());
    packApi.installCharacterPack(project.pack);
    refreshPackGallery();
    applyImportedPreset(project.preset);
    window.dispatchEvent(
      new CustomEvent('interless:preview-characters', {
        detail: { characterIds: Object.keys(packApi.catalog) },
      }),
    );
    exportStatus.textContent =
      'Проект открыт: оформление и анимации восстановлены. Можно продолжать настройку и скопировать код для StreamElements.';
  } catch (error) {
    exportStatus.textContent = 'Проект не открыт: ' + error.message;
  } finally {
    event.target.value = '';
  }
};
