import { EmojiButton } from 'https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.2/dist/index.min.js';

export function SetEmojiPicker() {
    document.addEventListener("DOMContentLoaded", () => {
        const folderIcon = document.querySelectorAll(".folder-icon");

        const picker = new EmojiButton({
        position: 'bottom-start',
        zIndex: 9999,
        autoHide: true,
        showPreview: false,
        showRecents: true,
        theme: 'light'
        });

        picker.on('emoji', emoji => {
            folderIcon.forEach(icon => {
                icon.textContent = emoji.emoji;
            });
        });

        folderIcon.forEach(icon => {
            icon.addEventListener('click', () => {
                picker.togglePicker(icon);
            });
        });
    });
}
