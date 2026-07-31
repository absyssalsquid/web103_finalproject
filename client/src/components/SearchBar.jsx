import './SearchBar.css'

const SearchBar = ({ state, setState, searchPlaceholder, filterOptions, sortOptions }) => {

  function handleFilterChange(e){
    setState((prev) => ({ 
      ...prev, 
      page: 1,
      filterBy: e.target.value 
    }))
  }

  function handleSortChange(e){
    setState((prev) => ({ 
      ...prev, 
      page: 1,
      sortBy: e.target.value 
    }))
  }

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
            onChange={handleFilterChange}
          >
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
      )}

      {sortOptions && (
          <select
            value={state.sortBy}
            onChange={handleSortChange}
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
