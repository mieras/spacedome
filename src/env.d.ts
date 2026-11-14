/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Visual Editing aan voor dit verzoek (geldige preview-cookie én in de iframe van de Studio). */
    visualEditing: boolean;
  }
}
