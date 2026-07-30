import './SearchBar.css'

const SearchBar = ({ state, setState, searchPlaceholder, filterOptions, sortOptions }) => {
  return (
    <div className='search-bar'>
      <input
        type='search'
        className='search-input'
        placeholder={searchPlaceholder}
        value={state.search}
        onChange={(e) => setState((prev) => ({ ...prev, search: e.target.value }))}
      />

      {filterOptions && (
          <select
            value={state.filterBy}
            onChange={(e) => setState((prev) => ({ ...prev, filterBy: e.target.value }))}
          >
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
      )}

      {sortOptions && (
          <select
            value={state.sortBy}
            onChange={(e) => setState((prev) => ({ ...prev, sortBy: e.target.value }))}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
      )}
    </div>
  )
}

export default SearchBar
