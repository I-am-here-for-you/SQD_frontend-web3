"use client";

import useGroupUIControlStore from "@/store/UI_control/groupPage/newgroupPage";
import react, { useState, useEffect } from "react";
import useAPI from "@/hooks/useAPI";
import { IGROUP, IUSER, INFT, ICOLLECTION } from "@/types";
import { useRouter } from "next/navigation";
import useActiveWeb3 from "@/hooks/useActiveWeb3";
import { Contract } from "ethers";
import GROUP_ABI from "@/constants/creator_group.json";
import { Marketplace_ADDRESSES } from "@/constants/config";
import MARKETPLACE_ABI from "@/constants/marketplace.json";
import useToastr from "@/hooks/useToastr";
import useAuth from "@/hooks/useAuth";
import { Icon } from "@iconify/react/dist/iconify.js";

type auctionQueryType = {
    initialPrice: string,
    reducingRate: string,
    salePeriod_day: string,
    salePeriod_hour: string,
    salePeriod_minute: string,
}
interface ListModalInterface {
    listNft: INFT,
    groupAddress: string
}
const ListModal = ({ listNft, groupAddress }: ListModalInterface) => {
    const setListModalState = useGroupUIControlStore((state) => state.updateListModal);
    const [auctionType, setAuctionType] = useState<number>(0);
    const [step, setStep] = useState<number>(0);
    const [auctionQuery, setAuctionQuery] = useState<auctionQueryType>({
        initialPrice: "",
        reducingRate: "",
        salePeriod_day: "",
        salePeriod_hour: "",
        salePeriod_minute: "",
    });

    const router = useRouter();
    const api = useAPI();

    const { address, chainId, signer, chain } = useActiveWeb3();
    const [contract, setContract] = useState<Contract | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { signIn, isAuthenticated, user } = useAuth();
    const { showToast } = useToastr();

    useEffect(() => {
        if (!address || !chainId || !signer) {
            return;
        }
        const _contract = new Contract(groupAddress, GROUP_ABI, signer);

        setContract(_contract);
    }, [address, chainId, signer, groupAddress]);


    const calculateTime = () => {
        return Number(auctionQuery.salePeriod_day) * 24 * 3600 + Number(auctionQuery.salePeriod_hour) * 3600 + Number(auctionQuery.salePeriod_minute) * 60;
    }

    const handleNext = async () => {
        console.log("step: ", step);
        if (step === 0) {
            console.log(auctionQuery.salePeriod_day + " : " + auctionQuery.salePeriod_hour + " : " + auctionQuery.salePeriod_minute);
            if (!auctionQuery.initialPrice) {
                return;
            }
            if ((!auctionType || auctionType === 1) && (!auctionQuery.salePeriod_day || !auctionQuery.salePeriod_hour || !auctionQuery.salePeriod_minute)) {

                return;
            }
            if (auctionType === 1 && !auctionQuery.reducingRate) {
                return;
            }
            setStep(1);
            console.log("step: ", step);
        }
        else {

            try {
                if (!contract) throw "no contract";
                if (!chainId) throw "Invalid chain id";
                if (!user) throw "You must sign in";
                setIsLoading(true);
                console.log("groupAddress", groupAddress) ;
                console.log("listNft.collectionaddress ", listNft.collectionaddress) ;
                console.log("listNft.collectionid ", listNft.collectionid) ;
                const nftId = await contract.getNFTId(listNft.collectionaddress, Number(listNft.collectionid));
                console.log("nftId", nftId.toString()); 
                const _salePeriod = calculateTime() ? calculateTime() : 0;
                const _market_contract = new Contract(Marketplace_ADDRESSES[chainId], MARKETPLACE_ABI, signer) ;
                let listed_number ;
                if (auctionType === 0) {

                    const tx = await contract.listToEnglishAuction(nftId, BigInt(Number(auctionQuery.initialPrice) * 1e18), BigInt(_salePeriod));
                    await tx.wait();
                    listed_number = await _market_contract.getListedEnglishAuctionNumber() ;
                }
                else if (auctionType === 1) {
                    const tx = await contract.listToDutchAuction(nftId, BigInt(Number(auctionQuery.initialPrice) * 1e18), BigInt(Number(auctionQuery.reducingRate) * 1e18), BigInt(_salePeriod));
                    await tx.wait();
                    listed_number = await _market_contract.getListedDutchAuctionNumber() ;
                }
                else {
                    const tx = await contract.listToOfferingSale(nftId, BigInt(Number(auctionQuery.initialPrice) * 1e18));
                    await tx.wait();
                    listed_number = await _market_contract.getOfferingSaleAuctionNumber() ;
                }
                console.log("listed_number", listed_number) ;
                const listNumber = (Number(Number(listed_number) - 1)).toString() ;
                console.log("listed_number", listNumber) ;
                await api.post("/api/updateNft", {
                    id: listNft.id, owner: listNft.owner, status: "list", auctionType: auctionType, initialPrice: auctionQuery.initialPrice,
                    salePeriod: _salePeriod, currentPrice: auctionQuery.initialPrice, currentBidder: "0x000", reducingRate: auctionQuery.reducingRate ? auctionQuery.reducingRate : 0,
                    listedNumber: listNumber
                })
                setListModalState(false);
                router.back();
            } catch (error: any) {
                if (String(error.code) === "ACTION_REJECTED") {
                    showToast("User rejected transaction.", "warning");
                } else {
                    showToast(String(error), "warning");
                }
            }
            finally {
                setIsLoading(false);
            }
        }
    }
    return (
        <>
            <div className="">
                <div
                    className="join_background"
                    onClick={() => {
                        setListModalState(false);
                    }}
                ></div>
                <div className="joinModal drop-shadow-lg">

                    <div
                        className="closeBtn"
                        onClick={() => {
                            setListModalState(false);
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M1.6 16L0 14.4L6.4 8L0 1.6L1.6 0L8 6.4L14.4 0L16 1.6L9.6 8L16 14.4L14.4 16L8 9.6L1.6 16Z"
                                fill="#322A44"
                            />
                        </svg>
                    </div>
                    <div className={`p-5  rounded-lg ${!step && "h-[600px]"} flex flex-col justify-between`}>

                        {
                            step === 0 &&
                            <div>

                                <h1 className="text-center mt-2 text-gray-400 text-lg ">LIST TO MARKETPLACE</h1>
                                <h1 className="text-left mt-5 text-chocolate-main text-lg ">CHOOSE AN AUCTION TYPE</h1>
                                <form className="mt-2 text-lg text-chocolate-main">

                                    <label className="flex  rounded-md  py-2 my-1  hover:bg-indigo-300 cursor-pointer ">
                                        <input type="radio" name="Country" checked={auctionType === 0} onChange={() => setAuctionType(0)} />
                                        <div className="pl-2">ENGLISH AUCTION</div>
                                    </label>

                                    <label className="flex  rounded-md  py-2 my-1  hover:bg-indigo-300 cursor-pointer ">
                                        <input type="radio" name="Country" checked={auctionType === 1} onChange={() => setAuctionType(1)} />
                                        <div className="pl-2">DUTCH AUCTION</div>
                                    </label>

                                    <label className="flex  rounded-md  py-2 my-1  hover:bg-indigo-300 cursor-pointer" >
                                        <input type="radio" name="Country" checked={auctionType === 2} onChange={() => setAuctionType(2)} />
                                        <div className="pl-2">OFFERING</div>
                                    </label>

                                </form>
                                <h1 className="text-left mt-5 text-chocolate-main text-lg ">SET A INITIAL PRICE</h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex p-[1px] border rounded-[30px] border-black  h-[30px]  w-1/2">
                                        <input value={auctionQuery.initialPrice} onChange={(e) =>
                                            setAuctionQuery((prev) => ({
                                                ...prev,
                                                initialPrice: e.target.value,
                                            }))} className="w-full h-full bg-transparent  border border-none outline-none outline-[0px] px-[10px] text-chocolate-main" type="text" placeholder="3000" />
                                    </div>
                                    <div className="flex items-center justify-center text-[20px]">USDC</div>
                                </div>
                                {
                                    auctionType === 1 &&
                                    <>
                                        <h1 className="text-left mt-5 text-chocolate-main text-lg ">REDUCING RATE</h1>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex p-[1px] border rounded-[30px] border-black  h-[30px]  w-1/2">
                                                <input value={auctionQuery.reducingRate} onChange={(e) =>
                                                    setAuctionQuery((prev) => ({
                                                        ...prev,
                                                        reducingRate: e.target.value,
                                                    }))} className="w-full h-full bg-transparent  border border-none outline-none outline-[0px] px-[10px] text-chocolate-main" type="text" placeholder="10" />
                                            </div>
                                            <div className="flex items-center justify-center text-[20px]">USDC PER HOUR</div>
                                        </div>
                                    </>
                                }

                                {
                                    auctionType !== 2 &&
                                    <>
                                        <h1 className="text-left mt-5 text-chocolate-main text-lg ">SET SALE PERIOD</h1>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 ">
                                            <div className="flex items-center gap-3">
                                                <div className="flex p-[1px] border rounded-[30px] border-black  h-[30px]  w-1/2">
                                                    <input value={auctionQuery.salePeriod_day} onChange={(e) =>
                                                        setAuctionQuery((prev) => ({
                                                            ...prev,
                                                            salePeriod_day: e.target.value,
                                                        }))} className="w-full h-full bg-transparent  border border-none outline-none outline-[0px] px-[10px] text-chocolate-main" type="text" placeholder="1" />
                                                </div>
                                                <div className="flex justify-center text-[15px]">DAY(S)</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex p-[1px] border rounded-[30px] border-black  h-[30px]  w-1/2">
                                                    <input value={auctionQuery.salePeriod_hour} onChange={(e) =>
                                                        setAuctionQuery((prev) => ({
                                                            ...prev,
                                                            salePeriod_hour: e.target.value,
                                                        }))} className="w-full h-full bg-transparent  border border-none outline-none outline-[0px] px-[10px] text-chocolate-main" type="text" placeholder="10" />
                                                </div>
                                                <div className="flex items-center justify-center text-[15px]">HOUR(S)</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex p-[1px] border rounded-[30px] border-black  h-[30px]  w-1/2">
                                                    <input value={auctionQuery.salePeriod_minute} onChange={(e) =>
                                                        setAuctionQuery((prev) => ({
                                                            ...prev,
                                                            salePeriod_minute: e.target.value,
                                                        }))} className="w-full h-full bg-transparent  border border-none outline-none outline-[0px] px-[10px] text-chocolate-main" type="text" placeholder="0" />
                                                </div>
                                                <div className="flex  items-start justify-center text-[15px]">MINUTES(S)</div>
                                            </div>
                                        </div>
                                    </>
                                }
                            </div>

                        }
                        {
                            step === 1 &&
                            <>
                                <div>
                                    <h1 className="text-center mt-2 text-gray-400 text-lg ">LIST TO MARKETPLACE</h1>

                                    <h1 className="text-gray-400 text-lg mt-3">AUCTION TYPE</h1>
                                    <div className="text-chocolate-main text-xl">
                                        {
                                            !auctionType ? "ENGLISH AUCTION" : auctionType === 1 ? "DUTCH AUCTION" : "OFFERING"
                                        }
                                    </div>
                                    <h1 className="text-gray-400 text-lg mt-5">INITIAL PRICE</h1>
                                    <div className="text-chocolate-main text-xl">
                                        {
                                            auctionQuery.initialPrice
                                        }
                                    </div>

                                    {
                                        auctionType === 1 &&
                                        <>
                                            <h1 className="text-gray-400 text-lg mt-5">REDUCING RATE</h1>
                                            <div className="text-chocolate-main text-xl">
                                                {
                                                    auctionQuery.reducingRate
                                                }
                                            </div>
                                        </>

                                    }
                                    {
                                        auctionType !== 2 &&
                                        <>
                                            <h1 className="text-gray-400 text-lg mt-5 "> EXPIRES IN</h1>
                                            <div className="text-chocolate-main text-xl">
                                                {
                                                    auctionQuery.salePeriod_day + " DAY, " + auctionQuery.salePeriod_hour + " HOURS,    AND " + auctionQuery.salePeriod_minute + " MINUTES"
                                                }
                                            </div>
                                        </>

                                    }
                                </div>
                            </>
                        }
                        <div className="flex justify-center items-center mt-5">

                            <button onClick={handleNext} className={`border  ${!step ? "bg-[#322A44]" : "bg-[#1C8D00]"} text-white rounded-full pl-4 pr-4 w-[380px] 
                                text-lg text-center flex items-center justify-center`}>
                                {isLoading ?
                                    <>
                                        <Icon icon="eos-icons:bubble-loading" width={20} height={20} /> PROCESSING...
                                    </> :
                                    !step ? "NEXT" : "CONFIRM AND LIST"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};

export default ListModal;