/**
 * Smart City Location Search Controller
 * Provides debounced geocoding search with autocomplete suggestions,
 * keyboard navigation, landmark shortcuts, and smooth MapLibre flyTo animations.
 */

export class SmartCityMapSearch {
  constructor(mapManager, mapState, mapLayers = null) {
    this.mapManager = mapManager;
    this.mapState = mapState;
    this.mapLayers = mapLayers;

    this.searchInput = document.getElementById('mapSearchInput');
    this.clearBtn = document.getElementById('mapSearchClearBtn');
    this.spinner = document.getElementById('mapSearchSpinner');
    this.resultsDropdown = document.getElementById('mapSearchResults');
    this.chipsContainer = document.getElementById('mapSearchChips');

    this.debounceTimer = null;
    this.debounceMs = 350;
    this.currentResults = [];
    this.selectedIndex = -1;

    this.init();
  }

  init() {
    if (!this.searchInput || !this.resultsDropdown) return;

    // Input debounce listener
    this.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      this.updateClearBtn(q);

      clearTimeout(this.debounceTimer);
      if (q.length < 2) {
        this.hideDropdown();
        if (q.length === 0) {
          if (this.mapManager) this.mapManager.clearSearchMarker();
          if (this.mapLayers) this.mapLayers.clearSearchedLocation();
        }
        return;
      }

      this.debounceTimer = setTimeout(() => {
        this.performSearch(q);
      }, this.debounceMs);
    });

    // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // Clear button
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.clear();
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#topSearchSection') && !e.target.closest('#urbanMapSearchWrapper')) {
        this.hideDropdown();
      }
    });

    // Preset shortcut landmark chips
    if (this.chipsContainer) {
      this.chipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-landmark-name]');
        if (chip) {
          const name = chip.getAttribute('data-landmark-name');
          const lat = parseFloat(chip.getAttribute('data-lat'));
          const lon = parseFloat(chip.getAttribute('data-lon'));
          this.selectLocation({ name, display_name: name, lat, lon });
        }
      });
    }
  }

  updateClearBtn(query) {
    if (this.clearBtn) {
      if (query && query.length > 0) {
        this.clearBtn.classList.remove('hidden');
      } else {
        this.clearBtn.classList.add('hidden');
      }
    }
  }

  showSpinner(show) {
    if (this.spinner) {
      if (show) {
        this.spinner.classList.remove('hidden');
      } else {
        this.spinner.classList.add('hidden');
      }
    }
  }

  async performSearch(query) {
    this.showSpinner(true);
    try {
      const response = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.currentResults = Array.isArray(data) ? data : [];
      this.renderDropdown(this.currentResults, query);
    } catch (err) {
      console.warn('[MapSearch] Search error:', err);
      this.renderDropdown([], query, true);
    } finally {
      this.showSpinner(false);
    }
  }

  renderDropdown(results, query, isError = false) {
    if (!this.resultsDropdown) return;
    this.selectedIndex = -1;

    if (isError) {
      this.resultsDropdown.innerHTML = `
        <div class="p-3 text-center text-xs text-rose-400">
          Search request failed. Please check network.
        </div>
      `;
      this.showDropdown();
      return;
    }

    if (!results || results.length === 0) {
      this.resultsDropdown.innerHTML = `
        <div class="p-3 text-center text-xs text-slate-400">
          No matching locations found for "<span class="text-white font-medium">${escapeHtml(query)}</span>".
        </div>
      `;
      this.showDropdown();
      return;
    }

    const itemsHtml = results.map((item, index) => {
      const icon = this.getLocationIcon(item.type);
      return `
        <div data-index="${index}" class="search-result-item px-3 py-2.5 hover:bg-dark-800/90 cursor-pointer border-b border-slate-800/60 last:border-0 transition flex items-center justify-between gap-2 group">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="p-1.5 rounded-lg bg-dark-800 text-sky-400 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition flex-shrink-0">
              ${icon}
            </span>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition">
                ${escapeHtml(item.name)}
              </div>
              <div class="text-[11px] text-slate-400 truncate">
                ${escapeHtml(item.display_name)}
              </div>
            </div>
          </div>
          <span class="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-dark-900 border border-slate-800 flex-shrink-0 uppercase">
            ${item.type || 'place'}
          </span>
        </div>
      `;
    }).join('');

    this.resultsDropdown.innerHTML = itemsHtml;
    this.showDropdown();

    // Bind item clicks
    this.resultsDropdown.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        if (this.currentResults[idx]) {
          this.selectLocation(this.currentResults[idx]);
        }
      });
    });
  }

  getLocationIcon(type = '') {
    const t = String(type).toLowerCase();
    if (t.includes('city') || t.includes('administrative')) {
      return '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
    }
    if (t.includes('university') || t.includes('school') || t.includes('institution')) {
      return '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>';
    }
    if (t.includes('station') || t.includes('railway')) {
      return '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>';
    }
    return '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>';
  }

  handleKeydown(e) {
    if (!this.resultsDropdown || this.resultsDropdown.classList.contains('hidden')) {
      return;
    }

    const items = this.resultsDropdown.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % items.length;
      this.highlightItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
      this.highlightItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.selectedIndex >= 0 && this.currentResults[this.selectedIndex]) {
        this.selectLocation(this.currentResults[this.selectedIndex]);
      } else if (items.length > 0) {
        this.selectLocation(this.currentResults[0]);
      }
    } else if (e.key === 'Escape') {
      this.hideDropdown();
    }
  }

  highlightItem(items) {
    items.forEach((item, idx) => {
      if (idx === this.selectedIndex) {
        item.classList.add('bg-dark-800', 'border-sky-500/50');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('bg-dark-800', 'border-sky-500/50');
      }
    });
  }

  setMapLayers(mapLayers) {
    this.mapLayers = mapLayers;
  }

  async selectLocation(item) {
    if (!item) return;

    if (this.searchInput) {
      this.searchInput.value = item.name;
      this.updateClearBtn(item.name);
    }
    this.hideDropdown();

    // Delegate to unified dashboard controller to update ALL dashboard values,
    // headers, ephemeris, air quality, traffic, map canvas, and top-left HUD!
    if (window.weatherAirApp && typeof window.weatherAirApp.selectLocation === 'function') {
      window.weatherAirApp.selectLocation(item);
      return;
    }

    // Direct fallback if window.weatherAirApp is not yet mounted
    if (this.mapManager) {
      this.mapManager.flyTo(item.lon, item.lat, 13.5);
      this.mapManager.clearSearchMarker();
    }
    if (this.mapLayers) {
      this.mapLayers.setSearchedLocation(item, null);
    }
  }

  clear() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.updateClearBtn('');
      this.searchInput.focus();
    }
    this.hideDropdown();
    if (this.mapManager) {
      this.mapManager.clearSearchMarker();
    }
    if (this.mapLayers) {
      this.mapLayers.clearSearchedLocation();
    }
    if (window.weatherAirApp && window.weatherAirApp.latestData?.astronomy) {
      window.weatherAirApp.renderEphemerisBox(window.weatherAirApp.latestData.astronomy, window.weatherAirApp.latestData.cityWeather);
    }
  }

  showDropdown() {
    if (this.resultsDropdown) {
      this.resultsDropdown.classList.remove('hidden');
    }
  }

  hideDropdown() {
    if (this.resultsDropdown) {
      this.resultsDropdown.classList.add('hidden');
    }
    this.selectedIndex = -1;
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
