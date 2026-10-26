import { Component } from '@angular/core';
import { TERMS } from '../../terminology';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  t = TERMS;
  year = new Date().getFullYear();

}
