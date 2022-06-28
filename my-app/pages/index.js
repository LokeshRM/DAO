import Head from "next/head";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { providers, Contract, utils } from "ethers";
import { dao_address, dao_abi, nft_abi, nft_address } from "../contract";
import web3Modal from "web3modal";

export default function Home() {
    const [walletConnected, setWalletConnected] = useState(false);
    const [noOfProposals, setNoOfProposals] = useState(0);
    const [nftBalance, setnftBalance] = useState(0);
    const [treasuryBalance, settreasuryBalance] = useState(0);
    const [proposalsData, setProposalsData] = useState([]);
    const [proposalTab, setProposalTab] = useState("");
    const web3modalRef = useRef();
    const inputRef = useRef();

    const connectWallet = async () => {
        try {
            await getProvider();
            setWalletConnected(true);
            getNoOfProposals();
            getNftBalance();
            getContractBalance();
        } catch (err) {
            console.log(err);
        }
    };

    const getProvider = async (needSigner = false) => {
        const instance = await web3modalRef.current.connect();
        const provider = new providers.Web3Provider(instance);
        const { chainId } = await provider.getNetwork();
        if (chainId !== 3) {
            window.alert("change network to ropsten");
            throw new Error("change to ropsten network");
        }
        if (needSigner) {
            const signer = provider.getSigner();
            return signer;
        }
        return provider;
    };

    const getNftBalance = async () => {
        try {
            const provider = await getProvider();
            const nft_contract = new Contract(nft_address, nft_abi, provider);
            const signer = await getProvider(true);
            const user = await signer.getAddress();
            const balance = await nft_contract.balanceOf(user);
            setnftBalance(parseInt(balance.toString()));
        } catch (err) {
            console.log(err);
        }
    };

    const getContractBalance = async () => {
        try {
            const provider = await getProvider();
            const balance = await provider.getBalance(dao_address);
            settreasuryBalance(utils.formatEther(balance));
        } catch (err) {
            console.log(err);
        }
    };

    const getProposalById = async (i) => {
        try {
            const provider = await getProvider();
            const dao_contract = new Contract(dao_address, dao_abi, provider);
            const data = await dao_contract.proposals(i);
            const dataParsed = {
                proposalId: i,
                nftId: data.nftTokenId.toString(),
                deadline: new Date(parseInt(data.deadline.toString()) * 1000),
                upVotes: data.upVotes.toString(),
                downVotes: data.downVotes.toString(),
                executed: data.executed,
            };
            console.log(dataParsed);
            return dataParsed;
        } catch (err) {
            console.log(err);
        }
    };

    const getNoOfProposals = async () => {
        try {
            const provider = await getProvider();
            const dao_contract = new Contract(dao_address, dao_abi, provider);
            const proposals = await dao_contract.proposalIndex();
            setNoOfProposals(parseInt(proposals.toString()));
        } catch (err) {
            console.log(err);
        }
    };

    const voteProposals = async (proposalindex, voteStatus) => {
        try {
            const signer = await getProvider(true);
            const dao_contract = new Contract(dao_address, dao_abi, signer);
            const tx = await dao_contract.voteProposal(
                voteStatus,
                proposalindex
            );
            await tx.wait();
            window.alert("voted successfully");
            getProposals();
        } catch (err) {
            console.log(err);
        }
    };

    const executeProposal = async (proposalindex) => {
        try {
            const signer = await getProvider(true);
            const dao_contract = new Contract(dao_address, dao_abi, signer);
            const tx = await dao_contract.execute(proposalindex);
            await tx.wait();
            window.alert("executed successfully");
            getProposals();
        } catch (err) {
            console.log(err);
        }
    };

    const getProposals = async () => {
        try {
            let proposals = [];
            for (let i = 0; i < noOfProposals; i++) {
                const data = await getProposalById(i);
                proposals.push(data);
            }
            console.log(proposals);
            setProposalsData(proposals);
        } catch (err) {
            console.log(err);
        }
    };

    const createProposals = async () => {
        try {
            const signer = await getProvider(true);
            const dao_contract = new Contract(dao_address, dao_abi, signer);
            const tx = await dao_contract.createProposal(
                inputRef.current.value
            );
            await tx.wait();
            window.alert("proposal created");
            getNoOfProposals();
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (!walletConnected) {
            web3modalRef.current = new web3Modal({
                network: "ropsten",
                providerOptions: {},
                disableInjectedProvider: false,
            });

            connectWallet();
        }
    }, [walletConnected]);

    useEffect(() => {
        if (proposalTab == "viewProposal") {
            getProposals();
        }
    }, [proposalTab]);

    const renderProposals = () => {
        if (proposalTab == "viewProposal") {
            return viewTab();
        } else if (proposalTab == "createProposal") {
            return createTab();
        }
    };

    const createTab = () => {
        if (nftBalance > 0) {
            return (
                <div className="mt-10">
                    <input
                        placeholder="  Token id to buy"
                        type="number"
                        className="block h-11 w-full rounded bg-[#24292d] shadow shadow-blue-400/50"
                        ref={inputRef}
                    />
                    <button
                        onClick={createProposals}
                        className="mt-5 px-5 py-3 rounded-md bg-gradient-to-r from-indigo-500 via-teal-500 to-pink-500 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-fuchsia-400/80 hover:shadow-fuchsia-500/50"
                    >
                        create proposal
                    </button>
                </div>
            );
        } else {
            return (
                <p>you are not allowed to vote or create due to no NFT owned</p>
            );
        }
    };

    const viewTab = () => {
        if (noOfProposals > 0) {
            return (
                <div className="pb-10 grid gap-y-8 grid-cols-2 md:grid-cols-3 justify-evenly">
                    {proposalsData.map((data, index) => (
                        <div
                            key={index}
                            className="mx-auto p-4 rounded-md shadow-md shadow-pink-500/80"
                        >
                            <p>Proposal id : {data.proposalId}</p>
                            <p>NFT id : {data.nftId}</p>
                            <p>Up votes &#128077; : {data.upVotes}</p>
                            <p>Down votes &#128078; : {data.downVotes}</p>
                            <p>Deadline : {data.deadline.toLocaleString()}</p>
                            <p>
                                Proposal Executed : {data.executed.toString()}
                            </p>
                            {data.deadline.getTime() > Date.now() &&
                            !data.executed ? (
                                <div className="mt-5">
                                    <button
                                        onClick={() => {
                                            voteProposals(data.proposalId, 1);
                                        }}
                                        className="px-4 py-2 rounded-md ml-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-fuchsia-400/80 hover:shadow-fuchsia-500/50 mb-2"
                                    >
                                        upvote &#128077;
                                    </button>
                                    <button
                                        onClick={() => {
                                            voteProposals(data.proposalId, 0);
                                        }}
                                        className="px-4 py-2 rounded-md ml-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-fuchsia-400/80 hover:shadow-fuchsia-500/50"
                                    >
                                        downVote &#128078;
                                    </button>
                                </div>
                            ) : data.deadline.getTime() < Date.now() &&
                              !data.executed ? (
                                <button
                                    onClick={() => {
                                        executeProposal(data.proposalId);
                                    }}
                                    className="mt-5 px-4 py-2 rounded-md ml-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-fuchsia-400/80 hover:shadow-fuchsia-500/50"
                                >
                                    execute
                                </button>
                            ) : (
                                <p>proposal executed</p>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen  bg-[#24292d] text-white">
            <div className="pb-3 md:pt-20 flex flex-col-reverse md:flex-row justify-evenly">
                <Head>
                    <title>Create Next App</title>
                    <meta
                        name="description"
                        content="Generated by create next app"
                    />
                </Head>
                <div className="mt-8 mx-auto font-mono text-lg font-light">
                    <p className="font-sans font-bold mb-10 tracking-wide text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-pink-300">
                        DAO
                    </p>
                    <p>Create and Vote proposals to buy NFT's</p>
                    <h1>Total no of proposals : {noOfProposals}</h1>
                    <p>Your CryptoRain NFT balance :{nftBalance}</p>
                    <p className="mb-10">
                        Treasury balance :{treasuryBalance}{" "}
                    </p>

                    <button
                        className="px-5 py-3 rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-fuchsia-400/80 hover:shadow-fuchsia-500/50"
                        onClick={() => setProposalTab("viewProposal")}
                    >
                        view
                    </button>
                    <button
                        className="px-5 py-3 rounded-md ml-10 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-indigo-500 hover:to-pink-500 shadow-md shadow-fuchsia-400/80 hover:shadow-fuchsia-500/50"
                        onClick={() => setProposalTab("createProposal")}
                    >
                        create
                    </button>
                    {proposalTab == "createProposal" && renderProposals()}
                </div>

                <div className="md:basis-1/2">
                    <Image src="/dao.jpg" width={800} height={600} />
                </div>
            </div>
            <div className="mt-10 md:mt-2">
                {proposalTab == "viewProposal" && renderProposals()}
            </div>
        </div>
    );
}
