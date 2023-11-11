import React, { useContext } from "react";
import { NotificationContext } from "../notification/Notification.context";
import { ModalContext } from "./Modal.context";
import { Store } from "../../context/Store.context";
import { useSetUsername } from "../username/Username.utils";
import "./Modal.scss";
import Button from "../button/Button";
import axios from "axios";

const Modal = () => {
  const { open, modalAttrs, setModalVisibility, setModalDetails } =
    useContext(ModalContext);
  const { state, setPostRequest } = useContext(Store);
  const { notification } = useContext(NotificationContext);
  const { username } = state;
  const setUsername = useSetUsername();

  const formRef = React.useRef<HTMLFormElement>(null);

  const onSearchHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    let { data } = await axios.get(`/search-games?term=${modalAttrs["text"]}`);
    setModalDetails("results", data);
    setModalDetails("filtered", false);
  };

  const addGameHandler = (name: string, image: string) => {
    let games = [
      ...modalAttrs["games"],
      {
        name: name,
        image: image,
      },
    ];
    setModalDetails("games", games);
  };

  const removeGameHandler = (name: string, image: string) => {
    let games: any = modalAttrs["games"]?.filter(
      (game: any) => game.name !== name && game.image !== image
    );

    setModalDetails("games", games);
  };

  const gameAdded = (name: string) => {
    return modalAttrs["games"]?.some((game: any) => game.name === name);
  };

  const onSubmitHandler = async () => {
    let userInput;
    if (!username) {
      setUsername();
    }
    
    try {

      await axios.post("/add-suggested-game", {
        games: modalAttrs["games"],
        username: username ?? userInput,
      });

      notification(
        `${modalAttrs["games"].map(({ name }) =>
          JSON.stringify(name)
        )} added to suggested list successfully!`
      );

      setModalDetails("text", "");
      setModalDetails("games", []);
      setModalDetails("results", []);
      setModalVisibility();
      setPostRequest(true);
    } catch (error) {
      notification(error["response"]["data"]["message"] || "Unable to add game right now. Try again later.");
    }
  };

  const setFilteredList = () => {
    // If user is currently seeing their "suggested games to add list, change results to output new search according to text"
    if (modalAttrs["results"] === modalAttrs["games"]) {
      const syntheticEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      const formEvent =
        syntheticEvent as unknown as React.FormEvent<HTMLFormElement>;
      onSearchHandler(formEvent);
    }

    // Shows user their games in queue to add
    setModalDetails("results", modalAttrs["games"] || []);
    setModalDetails("filtered", true);
  };

  return (
    open && (
      <div id="modal-container">
        <div className="submit-modal">
          <h2 className="modal-header">Suggest a game</h2>
          <div className="modal-body">
            <div>
              <form
                className="search-wrapper"
                onSubmit={onSearchHandler}
                ref={formRef}
              >
                <label htmlFor="modal-search-input" hidden>
                  Search for a game
                </label>
                <input
                  id="modal-search-input"
                  className="search-field"
                  type="text"
                  placeholder="Search a game..."
                  value={modalAttrs["text"]}
                  onChange={(event) =>
                    setModalDetails("text", event.target.value)
                  }
                />
                <Button variant="modalInput" type="submit">
                  Search
                </Button>
              </form>
              <div>
                <Button
                  variant="modalInput"
                  className={
                    modalAttrs["results"] === modalAttrs["games"]
                      ? "selected"
                      : undefined
                  }
                  id="filter-games-btn"
                  type="button"
                  onClick={setFilteredList}
                >
                  Selected Games
                </Button>
              </div>
            </div>
            <div className="modal-listed-games">
              <div id="modal-results">
                {modalAttrs["results"]?.map(({ name, image }: any, i) => (
                  <div
                    className="modal-results-item"
                    key={`${name}-game-results-${i}`}
                  >
                    {/* <!-- Column --> */}
                    <div className="modal-results-image">
                      <img
                        src={image}
                        alt={`${name}-game-cover`}
                        height="100%"
                        width="100%"
                      />
                    </div>
                    {/* <!-- Column --> */}
                    <div>
                      <div className="modal-results-title">{name}</div>
                      <Button
                        hidden={gameAdded(name)}
                        variant="modalAdd"
                        onClick={() => addGameHandler(name, image)}
                      >
                        Add
                      </Button>
                      <Button
                        className="selected"
                        hidden={!gameAdded(name)}
                        variant="modalAdd"
                        onClick={() => removeGameHandler(name, image)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {modalAttrs["filtered"] && !modalAttrs["games"]?.length ? (
                  <div>
                    No games selected. Search for games to add before
                    submitting.
                  </div>
                ) : (
                  !modalAttrs["results"]?.length && (
                    <div>Start searching for games!</div>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button
              variant="modalToggle"
              disabled={!modalAttrs["games"]?.length}
              onClick={() => onSubmitHandler()}
            >
              Submit Game Suggestion
            </Button>
            <Button variant="modalToggle" onClick={setModalVisibility}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  );
};

export default Modal;
