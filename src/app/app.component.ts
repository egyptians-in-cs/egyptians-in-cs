import { Component, ViewEncapsulation, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RoutesRecognized  } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  title = 'Egyptians in CS';
  en_active: boolean = true;
  mobileMenuOpen: boolean = false;
  dropdownOpen: boolean = false;
  isDarkMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  ngOnInit(): void {
      this.router.events.subscribe(val => {
          if (val instanceof RoutesRecognized) {
              let lang = val.url.slice(1);
              this.changeLang(lang);
          }
      });
  }

  changeLang(lang: string): void {
    if(lang == "ar")
      this.en_active = false;
    else
      this.en_active = true;
    this.mobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }
}
