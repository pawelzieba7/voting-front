import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import api from './Api/api';
import './App.css';

export default function App() {
  const [manager, setManager] = useState();
  const [accounts, setAccounts] = useState();

  const [proposalArray, setProposalArray] = useState([]);
  const [newProposal, setNewProposal] = useState('');
  const [winner, setWinner] = useState();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [isManager, setIsManager] = useState(false);
  const [isPollClosed, setIsPollClosed] = useState(false);
  const [adresToDelegate, setAdresToDelegate] = useState('');
  const [section, setSection] = useState('poll');
  const [notification, setNotification] = useState();

  useEffect(() => {
    const onInit = () => {
      api.getManager().then((res) => setManager(res));
      api.getAccounts().then((res) => setAccounts(res));
      api.getProposals().then((res) => setProposalArray(res));
      api.getPollName().then((res) => setTitle(res));
      api.getPollDescription().then((res) => setDescription(res));
      api.isPollClosed().then(res => {
        setIsPollClosed(res)
        api.getWinnerProposalName().then(res => setWinner(res))
      })

    }

    const ethEnabled = () => {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        window.ethereum.enable();
        return true;
      }
      return false;
    }

    onInit()
    ethEnabled()
  }, []);

  useEffect(() => {
    const checkIfManager = () => {
      let isManager = false

      accounts.forEach(account => {
        if (account === manager) {
          isManager = true
        }
      });

      if (isManager) {
        setSection('options')
      }

      setIsManager(isManager)
    }

    accounts && checkIfManager()
  }, [accounts, manager]);

  const addProposal = () => {
    if (newProposal) {
      const newProposalObj = {
        name: newProposal,
        voteCount: 0,
      }

      setProposalArray([...proposalArray, newProposalObj])
      setNewProposal('')
    }
  }

  const removeOption = (optionToRemove) => {
    let tempArray = {}
    tempArray = proposalArray.filter((option) => {
      return optionToRemove !== option
    })

    setProposalArray(tempArray)
  }

  const onOptionSubmit = async (e) => {
    e.preventDefault();
    const accounts = await api.getAccounts();

    setNotification('Oczekiwanie na dodanie opcji wyboru...')

    const stringProposalArray = proposalArrayToStringArray()

    api.addProposalNames(accounts, stringProposalArray)
      .then(() => {
        setNotification('Dodawanie opcji wyboru si?? powiod??o!')
      })
      .catch(() => setNotification())
  }

  const proposalArrayToStringArray = () => {
    const stringArray = []
    proposalArray.map((proposal) => {
      stringArray.push(proposal.name)
    })

    return stringArray;
  }

  const voteOnProposal = async (proposal) => {
    if (isPollClosed) {
      return
    }
    const accounts = await api.getAccounts();

    setNotification('Oczekiwanie na wys??anie g??osu...')

    api.vote(accounts, proposal.id)
      .then(() => {
        setNotification('Wys??anie g??osu powiod??o si??!')
        api.getProposals().then((res) => setProposalArray(res));
      })
      .catch(() => setNotification('Wyst??pi?? b????d przy wysy??aniu g??osu'))
  }

  const onPollSubmit = async () => {
    const accounts = await api.getAccounts();

    setNotification('Oczekiwanie na zapisanie g??osowania...');

    api.setTitleAndDescription(accounts, [title, description])
      .then(() => {
        setNotification('Zapisywanie g??osowania powiod??o si??!');
        setTitle('');
        setDescription('');
      })
      .catch(() => setNotification('Wyst??pi?? b????d przy zapisywaniu g??osowania'));
  }

  const endPoll = async () => {
    const accounts = await api.getAccounts();

    setNotification('Oczekiwanie na zamkni??cie g??osowania...')

    await api.finalizePoll(accounts).then(() => {
      setNotification('Zamkni??cie g??osowania powiod??o si??!')
    })
      .catch(() => setNotification('Wyst??pi?? b????d przy zamykaniu g??osowania'));
  }

  const clearPoll = async () => {
    const accounts = await api.getAccounts();

    setNotification('Oczekiwanie na wyczyszczenie g??osowania...')

    api.clearData(accounts).then(() => {
      setNotification('Czyszczenie g??osowanie powiod??o si??!')
    })
      .catch(() => setNotification('Wyst??pi?? b????d przy czyszczeniu g??osowania'));
  }

  const chooseSection = (newSection) => {
    if (newSection !== section) {
      setSection(newSection)
    }
  }

  return (
    <div className="container">
      <div className="contentContainer">
        {isManager &&
          <div className="navButtonContainer">
            <button className="button" onClick={() => chooseSection('options')}>
              Ustawienia
            </button>
            <button className="button" onClick={() => chooseSection('pollOptions')}>
              Ustawienia opcji
            </button>
            <button className="button" onClick={() => chooseSection('poll')}>
              G??osowanie
            </button>
          </div>
        }
        <h1 className="title">Voting</h1>
        <div className="managerContainer">
          {section === 'options' &&
            <div className="sectionContainer">
              <h2 className="sectionTitle">Ustawienia g??osowania</h2>
              <input
                placeholder='Nazwa g??osowania'
                className="textInput"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)} />

              <textarea
                placeholder='Opis g??osowania'
                className="textAreaInput"
                value={description}
                onChange={e => setDescription(e.target.value)} />

              <button className="button" onClick={onPollSubmit}>Zapisz</button>
            </div>
          }

          {section === 'pollOptions' &&
            <div className="sectionContainer">
              <h2 className="sectionTitle">Dodawanie nowych opcji g??osowania</h2>
              <ul className="proposalList">
                {proposalArray.map((option, index) => {
                  return (
                    <li id={index} className="proposalContainer">
                      <p className="proposalBox">Opcja {index + 1}: {option.name}</p>
                      <button className="proposalButton" onClick={() => removeOption(option)}>-</button>
                    </li>
                  )
                })}
              </ul>
              <div className="newProposalContainer">
                <input
                  className="textInput"
                  placeholder="Opcja g??osowania"
                  type="text"
                  value={newProposal}
                  onChange={(e) => setNewProposal(e.target.value)} />
                <button className="proposalButton" onClick={() => addProposal()}>+</button>
              </div>

              <button className="button" onClick={onOptionSubmit}>Zapisz opcje</button>
            </div>
          }
          {(isManager && section !== 'poll') &&
            <div className="bottomButtonContainer">
              <button className="button" onClick={endPoll}>Zako??cz g??osowanie</button>
              <button className="button" onClick={clearPoll}>Wyczy???? g??osowanie</button>
            </div>
          }
        </div>

        {section === 'poll' &&
          <div className="sectionContainer">
            <h1>{title}</h1>
            <span className="description">{description}</span>
            <h2 className="sectionTitle">Opcje g??osowania</h2>
            <ul className="proposalList">
              {proposalArray.map((proposal, index) => {
                return (
                  <li key={index} className="proposalContainer" onClick={() => { voteOnProposal(proposal) }} >
                    <p className="proposalBox">{proposal.name}</p>
                    <p className="voteCount">{proposal.voteCount} {proposal.voteCount.length < 2 ? 'g??os' : 'g??osy'}</p>
                  </li>
                )
              })}
            </ul>
            {isPollClosed && <p>Zwyci????y?? g??os: {winner}</p>}
            {!isPollClosed &&
              <div className="delegateVoteContainer">
                <p>Chcesz odda?? sw??j g??os zaufanej osobie ?</p>
                <div className="delegateVoteSubContainer">
                  <input className="textInput" placeholder="Adres osoby kt??rej chcesz odda?? g??os" type="text" value={adresToDelegate} onChange={e => setAdresToDelegate(e.target.value)} />
                  <button className="button">Przeka??</button>
                </div>
              </div>
            }
          </div>
        }
        {notification}
      </div>
      { manager && <p className="footer"> Kontrakt jest zarz??dzany przez: {manager}.</p>}
    </div >
  )
}