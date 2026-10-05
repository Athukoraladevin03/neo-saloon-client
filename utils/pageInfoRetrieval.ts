import { NextRequest } from "next/server";

export default function getPaginationInfo(request : NextRequest){

    const pageNumberInstring = request.nextUrl.searchParams.get("pageNumber") || "1";
    
    const pageSizeInstring = request.nextUrl.searchParams.get("pageSize") || "10";

    const pageNumber = parseInt(pageNumberInstring);
    const pageSize = parseInt(pageSizeInstring);

    return {
        pageNumber : pageNumber,
        pageSize : pageSize
    }
}
