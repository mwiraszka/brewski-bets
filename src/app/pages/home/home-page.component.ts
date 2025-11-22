import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { MetaAndTitleService } from '@app/services/meta-and-title.service';

@Component({
  selector: 'bb-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  imports: [CommonModule],
})
export class HomePageComponent implements OnInit {
  fullText1 = 'brewski bets 2026';
  fullText2 = 'coming soon...';
  displayedText1 = '';
  displayedText2 = '';
  showCursor1 = true;
  showCursor2 = false;

  constructor(private readonly metaAndTitleService: MetaAndTitleService) {}

  public ngOnInit(): void {
    this.metaAndTitleService.updateTitle('brewski bets');
    this.metaAndTitleService.updateDescription(
      'Because betting with money is for losers.',
    );
    setTimeout(() => this.typeText(), 2000);
  }

  private typeText(): void {
    let index = 0;
    const type = () => {
      if (index < this.fullText1.length) {
        this.displayedText1 += this.fullText1[index];
        index++;

        // Erratic timing: random delays between 50-200ms with occasional longer pauses
        const delay =
          Math.random() < 0.15
            ? Math.random() * 200 + 200 // 15% chance of longer pause (200-400ms)
            : Math.random() * 150 + 50; // Normal typing speed (50-200ms)

        setTimeout(type, delay);
      } else {
        // Hide cursor on text1 and start typing text2 after 1 second pause
        this.showCursor1 = false;
        setTimeout(() => {
          this.showCursor2 = true;
          this.typeText2();
        }, 1000);
      }
    };

    // Start typing immediately (delay handled in ngOnInit)
    type();
  }

  private typeText2(): void {
    let index = 0;
    const type = () => {
      if (index < this.fullText2.length) {
        this.displayedText2 += this.fullText2[index];
        index++;

        // Erratic timing: random delays between 50-200ms with occasional longer pauses
        const delay =
          Math.random() < 0.15
            ? Math.random() * 200 + 200 // 15% chance of longer pause (200-400ms)
            : Math.random() * 150 + 50; // Normal typing speed (50-200ms)

        setTimeout(type, delay);
      }
    };

    type();
  }
}
