import { createContext, useCallback, useContext, useReducer } from 'react';
import axios from 'axios';

const API = '/api/boards';

const BoardContext = createContext(null);

const initialState = {
  boards: [],
  activeBoard: null,
  searchResults: [],
  archivedCards: [],
  archivedLists: [],
  labelColors: [],
  backgrounds: [],
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_BOARDS':
      return { ...state, boards: action.payload, loading: false, error: null };
    case 'SET_BOARD':
      return { ...state, activeBoard: action.payload, loading: false, error: null };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'SET_ARCHIVED_CARDS':
      return { ...state, archivedCards: action.payload };
    case 'SET_ARCHIVED_LISTS':
      return { ...state, archivedLists: action.payload };
    case 'SET_META':
      return { ...state, labelColors: action.payload.labelColors, backgrounds: action.payload.backgrounds };
    case 'OPTIMISTIC_MOVE_CARD': {
      const { sourceListId, targetListId, cardId, newPosition } = action.payload;
      if (!state.activeBoard) return state;
      const lists = state.activeBoard.lists.map((list) => {
        if (list.id === sourceListId) {
          return { ...list, cards: list.cards.filter((c) => c.id !== cardId) };
        }
        if (list.id === targetListId) {
          const sourceList = state.activeBoard.lists.find((l) => l.id === sourceListId);
          const card = sourceList?.cards.find((c) => c.id === cardId);
          if (!card) return list;
          const newCards = [...list.cards];
          newCards.splice(newPosition, 0, { ...card, position: newPosition });
          return { ...list, cards: newCards.map((c, i) => ({ ...c, position: i })) };
        }
        return list;
      });
      return { ...state, activeBoard: { ...state.activeBoard, lists } };
    }
    case 'OPTIMISTIC_REORDER_CARDS': {
      const { listId, cardIds } = action.payload;
      if (!state.activeBoard) return state;
      const lists = state.activeBoard.lists.map((list) => {
        if (list.id !== listId) return list;
        const cardMap = new Map(list.cards.map((c) => [c.id, c]));
        const reordered = cardIds.map((id, i) => ({ ...cardMap.get(id), position: i }));
        return { ...list, cards: reordered };
      });
      return { ...state, activeBoard: { ...state.activeBoard, lists } };
    }
    case 'OPTIMISTIC_REORDER_LISTS': {
      const { listIds } = action.payload;
      if (!state.activeBoard) return state;
      const listMap = new Map(state.activeBoard.lists.map((l) => [l.id, l]));
      const reordered = listIds.map((id, i) => ({ ...listMap.get(id), position: i }));
      return { ...state, activeBoard: { ...state.activeBoard, lists: reordered } };
    }
    case 'OPTIMISTIC_CARD_UPDATE': {
      const { cardId, updates } = action.payload;
      if (!state.activeBoard) return state;
      const lists = state.activeBoard.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      }));
      return { ...state, activeBoard: { ...state.activeBoard, lists } };
    }
    case 'OPTIMISTIC_CARD_DELETE': {
      const { cardId } = action.payload;
      if (!state.activeBoard) return state;
      const lists = state.activeBoard.lists.map((l) => ({
        ...l,
        cards: l.cards.filter((c) => c.id !== cardId),
      }));
      return { ...state, activeBoard: { ...state.activeBoard, lists } };
    }
    default:
      return state;
  }
}

export function BoardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setError = useCallback((err, fallback) => {
    const message = err?.response?.data?.message ?? err?.message ?? fallback;
    dispatch({ type: 'ERROR', payload: message });
  }, []);

  // Meta data
  const fetchMeta = useCallback(async () => {
    try {
      const [colors, backgrounds] = await Promise.all([
        axios.get(`${API}/meta/label-colors`),
        axios.get(`${API}/meta/backgrounds`),
      ]);
      dispatch({
        type: 'SET_META',
        payload: { labelColors: colors.data, backgrounds: backgrounds.data },
      });
    } catch (err) {
      console.error('Failed to load meta:', err);
    }
  }, []);

  // Boards
  const fetchBoards = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await axios.get(API);
      dispatch({ type: 'SET_BOARDS', payload: data });
      return data;
    } catch (err) {
      setError(err, 'Failed to load boards');
      throw err;
    }
  }, [setError]);

  const fetchBoard = useCallback(async (boardId) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await axios.get(`${API}/${boardId}`);
      dispatch({ type: 'SET_BOARD', payload: data });
      return data;
    } catch (err) {
      setError(err, 'Failed to load board');
      throw err;
    }
  }, [setError]);

  const createBoard = useCallback(async (payload) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await axios.post(API, payload);
      dispatch({ type: 'SET_BOARD', payload: data });
      await fetchBoards();
      return data;
    } catch (err) {
      setError(err, 'Failed to create board');
      throw err;
    }
  }, [fetchBoards, setError]);

  const updateBoard = useCallback(async (boardId, payload) => {
    try {
      const { data } = await axios.patch(`${API}/${boardId}`, payload);
      dispatch({ type: 'SET_BOARD', payload: data });
      await fetchBoards();
      return data;
    } catch (err) {
      setError(err, 'Failed to update board');
      throw err;
    }
  }, [fetchBoards, setError]);

  const deleteBoard = useCallback(async (boardId) => {
    dispatch({ type: 'LOADING' });
    try {
      await axios.delete(`${API}/${boardId}`);
      dispatch({ type: 'SET_BOARD', payload: null });
      await fetchBoards();
    } catch (err) {
      setError(err, 'Failed to delete board');
      throw err;
    }
  }, [fetchBoards, setError]);

  const resetBoards = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await axios.post(`${API}/reset`);
      dispatch({ type: 'SET_BOARDS', payload: data });
      dispatch({ type: 'SET_BOARD', payload: null });
      return data;
    } catch (err) {
      setError(err, 'Failed to reset boards');
      throw err;
    }
  }, [setError]);

  // Search
  const searchCards = useCallback(async (boardId, query) => {
    try {
      const { data } = await axios.get(`${API}/${boardId}/search`, { params: { q: query } });
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: data });
      return data;
    } catch (err) {
      setError(err, 'Search failed');
      return [];
    }
  }, [setError]);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
  }, []);

  // Labels
  const addLabel = useCallback(async (boardId, payload) => {
    try {
      const { data } = await axios.post(`${API}/${boardId}/labels`, payload);
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to add label');
      throw err;
    }
  }, [fetchBoard, setError]);

  const updateLabel = useCallback(async (boardId, labelId, payload) => {
    try {
      const { data } = await axios.patch(`${API}/${boardId}/labels/${labelId}`, payload);
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to update label');
      throw err;
    }
  }, [fetchBoard, setError]);

  const deleteLabel = useCallback(async (boardId, labelId) => {
    try {
      await axios.delete(`${API}/${boardId}/labels/${labelId}`);
      await fetchBoard(boardId);
    } catch (err) {
      setError(err, 'Failed to delete label');
      throw err;
    }
  }, [fetchBoard, setError]);

  // Archive
  const fetchArchivedCards = useCallback(async (boardId) => {
    try {
      const { data } = await axios.get(`${API}/${boardId}/archive/cards`);
      dispatch({ type: 'SET_ARCHIVED_CARDS', payload: data });
      return data;
    } catch (err) {
      setError(err, 'Failed to load archived cards');
      return [];
    }
  }, [setError]);

  const fetchArchivedLists = useCallback(async (boardId) => {
    try {
      const { data } = await axios.get(`${API}/${boardId}/archive/lists`);
      dispatch({ type: 'SET_ARCHIVED_LISTS', payload: data });
      return data;
    } catch (err) {
      setError(err, 'Failed to load archived lists');
      return [];
    }
  }, [setError]);

  const restoreCard = useCallback(async (boardId, cardId) => {
    try {
      await axios.post(`${API}/${boardId}/archive/cards/${cardId}/restore`);
      await fetchBoard(boardId);
      await fetchArchivedCards(boardId);
    } catch (err) {
      setError(err, 'Failed to restore card');
      throw err;
    }
  }, [fetchBoard, fetchArchivedCards, setError]);

  const restoreList = useCallback(async (boardId, listId) => {
    try {
      await axios.post(`${API}/${boardId}/archive/lists/${listId}/restore`);
      await fetchBoard(boardId);
      await fetchArchivedLists(boardId);
    } catch (err) {
      setError(err, 'Failed to restore list');
      throw err;
    }
  }, [fetchBoard, fetchArchivedLists, setError]);

  // Lists
  const createList = useCallback(async (boardId, payload) => {
    try {
      const { data } = await axios.post(`${API}/${boardId}/lists`, payload);
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to create list');
      throw err;
    }
  }, [fetchBoard, setError]);

  const updateList = useCallback(async (boardId, listId, payload) => {
    try {
      const { data } = await axios.patch(`${API}/${boardId}/lists/${listId}`, payload);
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to update list');
      throw err;
    }
  }, [fetchBoard, setError]);

  const deleteList = useCallback(async (boardId, listId) => {
    try {
      await axios.delete(`${API}/${boardId}/lists/${listId}`);
      await fetchBoard(boardId);
    } catch (err) {
      setError(err, 'Failed to delete list');
      throw err;
    }
  }, [fetchBoard, setError]);

  const archiveList = useCallback(async (boardId, listId) => {
    try {
      await axios.patch(`${API}/${boardId}/lists/${listId}`, { archived: true });
      await fetchBoard(boardId);
    } catch (err) {
      setError(err, 'Failed to archive list');
      throw err;
    }
  }, [fetchBoard, setError]);

  const reorderLists = useCallback(async (boardId, listIds) => {
    dispatch({ type: 'OPTIMISTIC_REORDER_LISTS', payload: { listIds } });
    try {
      await axios.post(`${API}/${boardId}/lists/reorder`, { listIds });
    } catch (err) {
      setError(err, 'Failed to reorder lists');
      await fetchBoard(boardId);
    }
  }, [fetchBoard, setError]);

  // Cards
  const createCard = useCallback(async (boardId, listId, payload) => {
    try {
      const { data } = await axios.post(`${API}/${boardId}/lists/${listId}/cards`, payload);
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to create card');
      throw err;
    }
  }, [fetchBoard, setError]);

  const updateCard = useCallback(async (boardId, cardId, payload) => {
    dispatch({ type: 'OPTIMISTIC_CARD_UPDATE', payload: { cardId, updates: payload } });
    try {
      const { data } = await axios.patch(`${API}/${boardId}/cards/${cardId}`, payload);
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to update card');
      await fetchBoard(boardId);
      throw err;
    }
  }, [fetchBoard, setError]);

  const deleteCard = useCallback(async (boardId, cardId) => {
    dispatch({ type: 'OPTIMISTIC_CARD_DELETE', payload: { cardId } });
    try {
      await axios.delete(`${API}/${boardId}/cards/${cardId}`);
      await fetchBoard(boardId);
    } catch (err) {
      setError(err, 'Delete failed');
      await fetchBoard(boardId);
      throw err;
    }
  }, [fetchBoard, setError]);

  const archiveCard = useCallback(async (boardId, cardId) => {
    try {
      await axios.patch(`${API}/${boardId}/cards/${cardId}`, { archived: true });
      await fetchBoard(boardId);
    } catch (err) {
      setError(err, 'Failed to archive card');
      throw err;
    }
  }, [fetchBoard, setError]);

  const moveCard = useCallback(async (boardId, cardId, sourceListId, targetListId, newPosition) => {
    dispatch({
      type: 'OPTIMISTIC_MOVE_CARD',
      payload: { sourceListId, targetListId, cardId, newPosition },
    });
    try {
      await axios.post(`${API}/${boardId}/cards/${cardId}/move`, { targetListId, position: newPosition });
      await fetchBoard(boardId);
    } catch (err) {
      setError(err, 'Failed to move card');
      await fetchBoard(boardId);
    }
  }, [fetchBoard, setError]);

  const reorderCards = useCallback(async (boardId, listId, cardIds) => {
    dispatch({ type: 'OPTIMISTIC_REORDER_CARDS', payload: { listId, cardIds } });
    try {
      await axios.post(`${API}/${boardId}/lists/${listId}/cards/reorder`, { cardIds });
    } catch (err) {
      setError(err, 'Failed to reorder cards');
      await fetchBoard(boardId);
    }
  }, [fetchBoard, setError]);

  // Checklists
  const addChecklist = useCallback(async (boardId, cardId, payload) => {
    try {
      const { data } = await axios.post(`${API}/${boardId}/cards/${cardId}/checklists`, payload);
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to add checklist');
      throw err;
    }
  }, [fetchBoard, setError]);

  const updateChecklist = useCallback(async (boardId, cardId, checklistId, payload) => {
    try {
      const { data } = await axios.patch(
        `${API}/${boardId}/cards/${cardId}/checklists/${checklistId}`,
        payload
      );
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to update checklist');
      throw err;
    }
  }, [fetchBoard, setError]);

  const deleteChecklist = useCallback(async (boardId, cardId, checklistId) => {
    try {
      await axios.delete(`${API}/${boardId}/cards/${cardId}/checklists/${checklistId}`);
      await fetchBoard(boardId);
    } catch (err) {
      setError(err, 'Failed to delete checklist');
      throw err;
    }
  }, [fetchBoard, setError]);

  // Comments
  const addComment = useCallback(async (boardId, cardId, payload) => {
    try {
      const { data } = await axios.post(`${API}/${boardId}/cards/${cardId}/comments`, payload);
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to add comment');
      throw err;
    }
  }, [fetchBoard, setError]);

  const updateComment = useCallback(async (boardId, cardId, commentId, payload) => {
    try {
      const { data } = await axios.patch(
        `${API}/${boardId}/cards/${cardId}/comments/${commentId}`,
        payload
      );
      await fetchBoard(boardId);
      return data;
    } catch (err) {
      setError(err, 'Failed to update comment');
      throw err;
    }
  }, [fetchBoard, setError]);

  const deleteComment = useCallback(async (boardId, cardId, commentId) => {
    try {
      await axios.delete(`${API}/${boardId}/cards/${cardId}/comments/${commentId}`);
      await fetchBoard(boardId);
    } catch (err) {
      setError(err, 'Failed to delete comment');
      throw err;
    }
  }, [fetchBoard, setError]);

  const clearError = useCallback(() => dispatch({ type: 'ERROR', payload: null }), []);

  const value = {
    boards: state.boards,
    activeBoard: state.activeBoard,
    searchResults: state.searchResults,
    archivedCards: state.archivedCards,
    archivedLists: state.archivedLists,
    labelColors: state.labelColors,
    backgrounds: state.backgrounds,
    loading: state.loading,
    error: state.error,
    fetchMeta,
    fetchBoards,
    fetchBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    resetBoards,
    searchCards,
    clearSearch,
    addLabel,
    updateLabel,
    deleteLabel,
    fetchArchivedCards,
    fetchArchivedLists,
    restoreCard,
    restoreList,
    createList,
    updateList,
    deleteList,
    archiveList,
    reorderLists,
    createCard,
    updateCard,
    deleteCard,
    archiveCard,
    moveCard,
    reorderCards,
    addChecklist,
    updateChecklist,
    deleteChecklist,
    addComment,
    updateComment,
    deleteComment,
    clearError,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoards() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoards must be used within BoardProvider');
  return ctx;
}
