import Phaser from 'phaser';
import './styles.css';
import { gameConfig } from './config/gameConfig';

declare global {
  interface Window {
    __AA_WINDOW_CLEANER_GAME__?: Phaser.Game;
  }
}

window.addEventListener('load', () => {
  window.__AA_WINDOW_CLEANER_GAME__ = new Phaser.Game(gameConfig);
  document.querySelector('canvas')?.setAttribute('tabindex', '0');
  document.querySelector('canvas')?.addEventListener('pointerdown', (event) => {
    (event.currentTarget as HTMLCanvasElement).focus();
  });
});
